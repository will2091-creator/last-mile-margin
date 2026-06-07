import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Card,
  currency,
  Field,
  FileText,
  MetricCard,
  SelectField,
  StatusBadge,
  TextField,
  Upload,
  UserPlus,
  Users,
} from "../shared";
import EmptyState from "../components/EmptyState";
import { loadActiveTeamPhotos, uploadTeamPhoto } from "../lib/teamPhotoRepository";

const splitPersonName = (name) => {
  if (!name) return { firstName: "", lastInitial: "" };
  const [firstName, last = ""] = name.split(" ");
  return {
    firstName,
    lastInitial: last.replace(".", ""),
  };
};

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getPeopleFromTeams = (teams) =>
  teams.flatMap((team) => {
    const shared = {
      teamId: team.id,
      teamName: team.name,
      truck: team.truck,
      route: team.route,
      complianceScore: team.complianceScore,
      surveyAvg: team.surveyAvg,
      routesCompleted: team.routesCompleted,
      status: team.status,
      photoStatus: team.photoStatus,
      photoUploadedAt: team.photoUploadedAt,
      photoUrl: team.photoUrl,
    };

    return [
      {
        id: `${team.id}-lead`,
        name: team.lead,
        role: "Lead Driver",
        ...shared,
      },
      {
        id: `${team.id}-helper`,
        name: team.helper,
        role: "Helper",
        ...shared,
        photoUrl: team.helperPhotoUrl || "",
        photoStatus: team.helperPhotoStatus || team.photoStatus,
        photoUploadedAt: team.helperPhotoUploadedAt || team.photoUploadedAt,
      },
    ].filter((person) => person.name);
  });

function TeamsDashboard({ teams, setTeams, claims, isDark = true }) {
  const blankPerson = {
    name: "",
    role: "Lead Driver",
    teamName: "",
    truck: "",
    route: "",
    complianceScore: 90,
    surveyAvg: 9.0,
    routesCompleted: 0,
    status: "Good",
    photoUrl: "",
    photoStatus: "Missing",
    photoUploadedAt: "Missing",
  };

  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [personForm, setPersonForm] = useState(blankPerson);
  const [draggedPersonId, setDraggedPersonId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [photoBackendStatus, setPhotoBackendStatus] = useState("Team photos ready.");

  const people = useMemo(() => getPeopleFromTeams(teams), [teams]);
  const activePeople = people.length;
  const photosUploaded = people.filter((person) => person.photoStatus === "Uploaded").length;
  const atRiskPeople = people.filter((person) => person.status === "At Risk").length;
  const totalClaimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  useEffect(() => {
    let isMounted = true;

    async function loadPhotos() {
      const result = await loadActiveTeamPhotos();
      if (!isMounted) return;

      if (!result.ok) {
        setPhotoBackendStatus(`Team photo storage unavailable: ${result.error}`);
        return;
      }

      if (!result.photos.length) {
        setPhotoBackendStatus("No active team photos in Supabase yet.");
        return;
      }

      setTeams((current) =>
        current.map((team) => {
          const leadPhoto = result.photos.find((photo) => photo.team_id === team.id && photo.person_key === "lead");
          const helperPhoto = result.photos.find((photo) => photo.team_id === team.id && photo.person_key === "helper");

          return {
            ...team,
            ...(leadPhoto
              ? {
                  photoUrl: leadPhoto.signedUrl,
                  photoStatus: "Uploaded",
                  photoUploadedAt: new Date(leadPhoto.uploaded_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                }
              : {}),
            ...(helperPhoto
              ? {
                  helperPhotoUrl: helperPhoto.signedUrl,
                  helperPhotoStatus: "Uploaded",
                  helperPhotoUploadedAt: new Date(helperPhoto.uploaded_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                }
              : {}),
          };
        })
      );
      setPhotoBackendStatus(`Loaded ${result.photos.length} active team photo${result.photos.length === 1 ? "" : "s"} from Supabase.`);
    }

    loadPhotos();
    return () => {
      isMounted = false;
    };
  }, [setTeams]);

  const getClaimDriver = (claim) => {
    if (claim.driver) return claim.driver;
    const matchingTeam = teams.find((team) => team.name === claim.team);
    return matchingTeam?.lead || "";
  };
  const getPersonClaims = (person) => claims.filter((claim) => getClaimDriver(claim) === person.name);
  const getPersonExposure = (person) => getPersonClaims(person).reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const getRouteClaims = (lead, helper) => claims.filter((claim) => [lead?.name, helper?.name].filter(Boolean).includes(getClaimDriver(claim)));
  const getRouteExposure = (lead, helper) => getRouteClaims(lead, helper).reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const clearDragState = () => {
    setDraggedPersonId(null);
    setDropTarget(null);
  };

  const getPersonSlot = (person) => (person.role === "Helper" ? "helper" : "lead");

  const removePersonFromTeam = (team, person) => {
    if (team.id !== person.teamId) return team;

    if (getPersonSlot(person) === "helper") {
      return {
        ...team,
        helper: "",
        helperPhotoUrl: "",
        helperPhotoStatus: "Missing",
        helperPhotoUploadedAt: "Missing",
      };
    }

    return {
      ...team,
      lead: "",
      photoUrl: "",
      photoStatus: "Missing",
      photoUploadedAt: "Missing",
    };
  };

  const assignPersonToTeam = (team, person, role) => {
    if (role === "Helper") {
      return {
        ...team,
        helper: person.name,
        helperPhotoUrl: person.photoUrl,
        helperPhotoStatus: person.photoStatus,
        helperPhotoUploadedAt: person.photoUploadedAt,
      };
    }

    return {
      ...team,
      lead: person.name,
      photoUrl: person.photoUrl,
      photoStatus: person.photoStatus,
      photoUploadedAt: person.photoUploadedAt,
    };
  };

  const movePersonToTeam = (personId, targetTeamId, targetRole) => {
    const person = people.find((item) => item.id === personId);
    const targetTeam = teams.find((team) => team.id === targetTeamId);
    if (!person || !targetTeam) return;
    if (person.teamId === targetTeamId && person.role === targetRole) return;

    const occupiedName = targetRole === "Helper" ? targetTeam.helper : targetTeam.lead;
    if (occupiedName && occupiedName !== person.name) {
      const confirmed = window.confirm(`Replace ${occupiedName} with ${person.name} as ${targetRole} on ${targetTeam.name}?`);
      if (!confirmed) return;
    }

    setTeams((current) =>
      current
        .map((team) => removePersonFromTeam(team, person))
        .map((team) => (team.id === targetTeamId ? assignPersonToTeam(team, person, targetRole) : team))
        .filter((team) => team.lead || team.helper)
    );

    clearDragState();
  };

  const handleDropOnPerson = (targetPerson) => {
    if (!draggedPersonId || draggedPersonId === targetPerson.id) return;
    const targetRole = targetPerson.role === "Lead Driver" ? "Helper" : "Lead Driver";
    movePersonToTeam(draggedPersonId, targetPerson.teamId, targetRole);
  };

  const handleDropOnSeat = (teamId, role) => {
    if (!draggedPersonId) return;
    movePersonToTeam(draggedPersonId, teamId, role);
  };

  const updatePersonField = (field, value) => setPersonForm((current) => ({ ...current, [field]: value }));

  const openAddPerson = () => {
    setEditingPerson(null);
    setPersonForm({
      ...blankPerson,
      teamName: `Team ${String.fromCharCode(65 + teams.length)}`,
      truck: "",
      route: "",
    });
    setShowForm(true);
  };

  const openEditPerson = (person) => {
    setEditingPerson(person);
    setPersonForm({ ...person });
    setShowForm(true);
  };

  const applyPersonToTeam = (person) => {
    const cleanedPerson = {
      ...person,
      complianceScore: Number(person.complianceScore || 0),
      surveyAvg: Number(person.surveyAvg || 0),
      routesCompleted: Number(person.routesCompleted || 0),
    };

    if (!cleanedPerson.name || !cleanedPerson.teamName || !cleanedPerson.truck) {
      alert("Person name, team name, and truck are required.");
      return;
    }

    const existingTeamId = editingPerson?.teamId;
    const targetTeam = existingTeamId ? teams.find((team) => team.id === existingTeamId) : null;

    if (targetTeam) {
      setTeams((current) =>
        current.map((team) => {
          if (team.id !== existingTeamId) return team;

          const roleUpdates =
            editingPerson.role === "Helper"
              ? {
                  helper: cleanedPerson.name,
                  helperPhotoUrl: cleanedPerson.photoUrl,
                  helperPhotoStatus: cleanedPerson.photoStatus,
                  helperPhotoUploadedAt: cleanedPerson.photoUploadedAt,
                }
              : {
                  lead: cleanedPerson.name,
                  photoUrl: cleanedPerson.photoUrl,
                  photoStatus: cleanedPerson.photoStatus,
                  photoUploadedAt: cleanedPerson.photoUploadedAt,
                };

          return {
            ...team,
            name: cleanedPerson.teamName,
            truck: cleanedPerson.truck,
            route: cleanedPerson.route,
            complianceScore: cleanedPerson.complianceScore,
            surveyAvg: cleanedPerson.surveyAvg,
            routesCompleted: cleanedPerson.routesCompleted,
            status: cleanedPerson.status,
            ...roleUpdates,
          };
        })
      );
    } else {
      const { firstName, lastInitial } = splitPersonName(cleanedPerson.name);
      const newTeam = {
        id: `TEAM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: cleanedPerson.teamName,
        lead: cleanedPerson.role === "Helper" ? "" : cleanedPerson.name,
        helper: cleanedPerson.role === "Helper" ? cleanedPerson.name : "",
        truck: cleanedPerson.truck,
        route: cleanedPerson.route,
        complianceScore: cleanedPerson.complianceScore,
        surveyAvg: cleanedPerson.surveyAvg,
        routesCompleted: cleanedPerson.routesCompleted,
        status: cleanedPerson.status,
        photoUrl: cleanedPerson.role === "Helper" ? "" : cleanedPerson.photoUrl,
        photoUploadedAt: cleanedPerson.role === "Helper" ? "Missing" : cleanedPerson.photoUploadedAt,
        photoStatus: cleanedPerson.role === "Helper" ? "Missing" : cleanedPerson.photoStatus,
        helperPhotoUrl: cleanedPerson.role === "Helper" ? cleanedPerson.photoUrl : "",
        helperPhotoUploadedAt: cleanedPerson.role === "Helper" ? cleanedPerson.photoUploadedAt : "Missing",
        helperPhotoStatus: cleanedPerson.role === "Helper" ? cleanedPerson.photoStatus : "Missing",
      };

      if (!newTeam.lead && firstName) {
        newTeam.lead = `${firstName} ${lastInitial ? `${lastInitial}.` : ""}`.trim();
      }

      setTeams((current) => [newTeam, ...current]);
    }

    setPersonForm(blankPerson);
    setEditingPerson(null);
    setShowForm(false);
  };

  const deletePerson = (person) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${person.name}? This cannot be undone.`);
    if (!confirmed) return;

    setTeams((current) =>
      current
        .map((team) => {
          if (team.id !== person.teamId) return team;

          if (person.role === "Helper") {
            return {
              ...team,
              helper: "",
              helperPhotoUrl: "",
              helperPhotoStatus: "Missing",
              helperPhotoUploadedAt: "Missing",
            };
          }

          return {
            ...team,
            lead: "",
            photoUrl: "",
            photoStatus: "Missing",
            photoUploadedAt: "Missing",
          };
        })
        .filter((team) => team.lead || team.helper)
    );
  };

  const handlePhotoUpload = async (person, file) => {
    if (!file) return;
    setPhotoBackendStatus(`Uploading ${person.name}'s photo...`);
    const result = await uploadTeamPhoto({ person, file });
    if (!result.ok) {
      setPhotoBackendStatus(`Team photo upload failed: ${result.error}`);
      return;
    }

    const photoUrl = result.photo.signedUrl || URL.createObjectURL(file);
    const uploadedAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    setTeams((current) =>
      current.map((team) => {
        if (team.id !== person.teamId) return team;

        if (person.role === "Helper") {
          return {
            ...team,
            helperPhotoUrl: photoUrl,
            helperPhotoStatus: "Uploaded",
            helperPhotoUploadedAt: uploadedAt,
          };
        }

        return {
          ...team,
          photoUrl,
          photoStatus: "Uploaded",
          photoUploadedAt: uploadedAt,
        };
      })
    );
    setPhotoBackendStatus(`${person.name}'s photo uploaded. It will auto-delete after 7 days.`);
  };

  const handleFormPhotoUpload = (file) => {
    if (!file) return;
    const photoUrl = URL.createObjectURL(file);
    const uploadedAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    setPersonForm((current) => ({
      ...current,
      photoUrl,
      photoStatus: "Uploaded",
      photoUploadedAt: uploadedAt,
    }));
  };

  const updateTeamField = (teamId, field, value) => {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              [field]: field === "routesCompleted" || field === "complianceScore" || field === "surveyAvg" ? Number(value || 0) : value,
            }
          : team
      )
    );
  };

  const getDispatchChecklist = (team, lead, helper, exposure, averageScore) => [
    {
      label: "Driver",
      done: Boolean(lead),
      detail: lead ? lead.name : "Open seat",
    },
    {
      label: "Helper",
      done: Boolean(helper),
      detail: helper ? helper.name : "Open seat",
    },
    {
      label: "Photos",
      done: [lead, helper].filter(Boolean).every((person) => person.photoStatus === "Uploaded"),
      detail: `${[lead, helper].filter((person) => person?.photoStatus === "Uploaded").length}/${[lead, helper].filter(Boolean).length || 2}`,
    },
    {
      label: "Compliance",
      done: averageScore >= 85,
      detail: `${averageScore}%`,
    },
    {
      label: "Claims",
      done: exposure < 1000,
      detail: currency.format(exposure),
    },
  ];

  const getRecommendation = (person) => {
    const exposure = getPersonExposure(person);
    if (person.status === "At Risk" || exposure > 1000) return "Review protection, entry path photos, and customer sign-off.";
    if (person.status === "Watch" || exposure > 500) return "Watch recent photo check-ins and claim patterns.";
    return "Ready for route. Keep documenting daily readiness.";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-400">Final Mile Margin</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">People Dashboard</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Track each driver or helper as an individual, upload their daily photo, then pair people side by side when
            they are assigned to the same truck or route.
          </p>
        </div>

        <button onClick={openAddPerson} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500">
          <UserPlus className="mr-2 inline h-4 w-4" />
          Add Person
        </button>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100">
        {photoBackendStatus} Active team photos are kept for 7 days.
      </div>

      {activePeople === 0 && (
        <EmptyState
          isDark={isDark}
          eyebrow="Team setup"
          title="Build your first route team"
          description="Add the driver, helper, truck, and route. Daily photo proof gives you evidence when a claim or customer dispute shows up later."
          Icon={Users}
          primaryAction={{ label: "Add Person", onClick: openAddPerson }}
          secondaryActions={[
            { label: "Add Route Team", onClick: openAddPerson },
          ]}
        />
      )}

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{editingPerson ? "Edit Person" : "Add Person"}</h2>
              <p className="text-sm text-slate-400">Add the person, role, truck, route, and daily photo status.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15">
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Person Name" value={personForm.name} onChange={(v) => updatePersonField("name", v)} placeholder="Marcus J." />
            <SelectField label="Role" value={personForm.role} onChange={(v) => updatePersonField("role", v)} options={["Lead Driver", "Helper"]} />
            <TextField label="Team Name" value={personForm.teamName} onChange={(v) => updatePersonField("teamName", v)} placeholder="Team A" />
            <TextField label="Truck #" value={personForm.truck} onChange={(v) => updatePersonField("truck", v)} placeholder="204" />
            <TextField label="Route" value={personForm.route} onChange={(v) => updatePersonField("route", v)} placeholder="Syracuse Appliance" />
            <Field label="Compliance Score" value={personForm.complianceScore} onChange={(v) => updatePersonField("complianceScore", v)} suffix="%" />
            <Field label="Survey Avg" value={personForm.surveyAvg} onChange={(v) => updatePersonField("surveyAvg", v)} />
            <SelectField label="Status" value={personForm.status} onChange={(v) => updatePersonField("status", v)} options={["Good", "Watch", "At Risk"]} />
          </div>

          <div className="mt-5 rounded-xl bg-white/5 p-4">
            <p className="mb-2 text-sm font-bold text-white">Person Photo</p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFormPhotoUpload(event.target.files?.[0])}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-500"
            />
            {personForm.photoUrl && <img src={personForm.photoUrl} alt="Person preview" className="mt-4 h-36 w-full rounded-xl object-cover" />}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => applyPersonToTeam(personForm)} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500">
              {editingPerson ? "Update Person" : "Save Person"}
            </button>
            <button
              onClick={() => {
                setPersonForm(blankPerson);
                setEditingPerson(null);
                setShowForm(false);
              }}
              className="rounded-xl bg-white/10 px-4 py-2 font-semibold hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active People Today" value={activePeople} note="Drivers and helpers listed" icon={Users} color="text-blue-400" />
        <MetricCard title="Photos Uploaded" value={`${photosUploaded} / ${activePeople}`} note="Individual readiness check" icon={Camera} color="text-emerald-400" />
        <MetricCard title="People At Risk" value={atRiskPeople} note="Needs review" icon={AlertTriangle} color="text-red-400" />
        <MetricCard title="Claims Exposure" value={currency.format(totalClaimsExposure)} note="Assigned to drivers" icon={FileText} color="text-orange-400" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Today's Routes</h2>
            <p className="text-sm text-slate-400">A simple dispatch list for who is riding together, where they are going, and what needs attention.</p>
          </div>
          <p className="text-sm font-semibold text-slate-400">{teams.length} routes assigned</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px] overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-4 bg-slate-950/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <p>People</p>
              <p>Route</p>
              <p>Truck</p>
              <p>Photos</p>
              <p>Driver Claims</p>
              <p>Status</p>
            </div>
          {teams.map((team) => {
            const lead = people.find((person) => person.teamId === team.id && person.role === "Lead Driver");
            const helper = people.find((person) => person.teamId === team.id && person.role === "Helper");
            const teamClaims = getRouteClaims(lead, helper);
            const exposure = getRouteExposure(lead, helper);
            const scores = [lead?.complianceScore, helper?.complianceScore].filter((score) => Number.isFinite(Number(score)));
            const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + Number(score), 0) / scores.length) : 0;
            const photoCount = [lead, helper].filter((person) => person?.photoStatus === "Uploaded").length;
            const assignedPeople = [lead, helper].filter(Boolean);
            const statusTone = team.status === "Good" ? "text-emerald-400" : team.status === "Watch" ? "text-orange-400" : "text-red-400";

            return (
              <div key={team.id} className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.9fr_0.9fr] items-center gap-4 border-t border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 -space-x-3">
                    {assignedPeople.map((person) => (
                      <div
                        key={person.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", person.id);
                          setDraggedPersonId(person.id);
                        }}
                        onDragEnd={clearDragState}
                        onDragOver={(event) => {
                          if (draggedPersonId && draggedPersonId !== person.id) {
                            event.preventDefault();
                            setDropTarget(`route-${person.id}`);
                          }
                        }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleDropOnPerson(person);
                        }}
                        className={`flex h-12 w-12 cursor-grab items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-xs font-black text-slate-300 transition ${
                          dropTarget === `route-${person.id}` ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        {person.photoUrl ? <img src={person.photoUrl} alt={person.name} className="h-full w-full rounded-full object-cover" /> : getInitials(person.name)}
                      </div>
                    ))}
                    {[lead, helper].filter(Boolean).length < 2 && (
                      <div
                        onDragOver={(event) => {
                          if (draggedPersonId) {
                            event.preventDefault();
                            setDropTarget(`${team.id}-open`);
                          }
                        }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleDropOnSeat(team.id, lead ? "Helper" : "Lead Driver");
                        }}
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-500 bg-slate-950 text-lg font-bold text-slate-500 ${
                          dropTarget === `${team.id}-open` ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        +
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{lead?.name || "Open Driver"}</p>
                    <p className="truncate text-xs text-slate-400">{helper?.name ? `with ${helper.name}` : "No helper assigned"}</p>
                  </div>
                </div>

                <input
                  value={team.route}
                  onChange={(event) => updateTeamField(team.id, "route", event.target.value)}
                  className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm font-bold text-white outline-none hover:border-white/10 hover:bg-white/5 focus:border-blue-500 focus:bg-slate-950/60"
                />

                <input
                  value={team.truck}
                  onChange={(event) => updateTeamField(team.id, "truck", event.target.value)}
                  className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm font-bold text-white outline-none hover:border-white/10 hover:bg-white/5 focus:border-blue-500 focus:bg-slate-950/60"
                />

                <div>
                  <p className={photoCount === assignedPeople.length && assignedPeople.length > 0 ? "text-sm font-black text-emerald-400" : "text-sm font-black text-orange-400"}>
                    {photoCount} / {assignedPeople.length || 2}
                  </p>
                  <p className="text-xs text-slate-500">uploaded</p>
                </div>

                <div>
                  <p className={exposure > 1000 ? "text-sm font-black text-red-400" : exposure > 0 ? "text-sm font-black text-orange-400" : "text-sm font-black text-emerald-400"}>
                    {currency.format(exposure)}
                  </p>
                  <p className="text-xs text-slate-500">{teamClaims.length} claim{teamClaims.length === 1 ? "" : "s"} · {averageScore}% score</p>
                </div>

                <select
                  value={team.status}
                  onChange={(event) => updateTeamField(team.id, "status", event.target.value)}
                  className={`rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-black outline-none focus:border-blue-500 ${statusTone}`}
                >
                  {["Good", "Watch", "At Risk"].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            );
          })}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Worker Bench</h2>
          <p className="mt-1 text-sm text-slate-400">Compact people list for edits, photo uploads, and drag-and-drop pairing.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {people.map((person) => {
          const exposure = getPersonExposure(person);

          return (
            <div
              key={person.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", person.id);
                setDraggedPersonId(person.id);
              }}
              onDragEnd={clearDragState}
              onDragOver={(event) => {
                if (draggedPersonId && draggedPersonId !== person.id) {
                  event.preventDefault();
                  setDropTarget(person.id);
                }
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                handleDropOnPerson(person);
              }}
              className={draggedPersonId === person.id ? "cursor-grabbing opacity-60" : "cursor-grab"}
            >
              <Card className={`p-4 transition ${dropTarget === person.id ? "ring-2 ring-blue-500" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-800">
                    {person.photoUrl ? <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-400">{getInitials(person.name)}</div>}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-white">{person.name}</h3>
                        <p className="truncate text-xs text-slate-400">{person.role} · Truck {person.truck}</p>
                        <p className="truncate text-xs text-slate-500">{person.route}</p>
                      </div>
                      <span className={person.photoStatus === "Uploaded" ? "rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400" : "rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400"}>
                        {person.photoStatus}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <p className="text-xs font-bold text-slate-400">Claims</p>
                      <p className={exposure > 0 ? "text-sm font-black text-red-400" : "text-sm font-black text-emerald-400"}>{currency.format(exposure)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/15">
                        <Upload className="mr-1 inline h-3 w-3" />
                        Photo
                        <input type="file" accept="image/*" onChange={(event) => handlePhotoUpload(person, event.target.files?.[0])} className="hidden" />
                      </label>
                      <button onClick={() => openEditPerson(person)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500">
                        Edit
                      </button>
                      <button onClick={() => deletePerson(person)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamsDashboard;
