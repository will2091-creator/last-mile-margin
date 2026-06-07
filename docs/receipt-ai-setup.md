# Receipt AI Setup

The mobile Receipts tab calls a Supabase Edge Function named `parse-receipt`.

## Deploy

```bash
npx supabase login
npx supabase functions deploy parse-receipt --project-ref eptoyxshbwglnnklqebl
```

## Add AI Secret

Set the OpenAI key in Supabase Edge Function secrets:

```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key --project-ref eptoyxshbwglnnklqebl
```

Optional model override:

```bash
npx supabase secrets set OPENAI_MODEL=gpt-5.4-mini --project-ref eptoyxshbwglnnklqebl
```

After deployment, use the mobile Receipts tab:

1. Tap `Take Photo`.
2. Photograph the receipt.
3. Tap `Analyze Receipt`.
4. Review vendor, amount, type, and notes.
5. Tap `Upload Receipt`.
