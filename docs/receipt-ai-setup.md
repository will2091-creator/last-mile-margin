# Receipt AI Setup

The mobile Receipts tab calls a Supabase Edge Function named `parse-receipt`.

## Deploy

```bash
npx supabase login
npx supabase functions deploy parse-receipt --project-ref eptoyxshbwglnnklqebl
```

## Add AI Secret

This function runs on Anthropic Claude. Set the Anthropic key in Supabase Edge Function secrets:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key --project-ref eptoyxshbwglnnklqebl
```

Optional model override (defaults to `claude-haiku-4-5`):

```bash
npx supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5 --project-ref eptoyxshbwglnnklqebl
```

After deployment, use the mobile Receipts tab:

1. Tap `Take Photo`.
2. Photograph the receipt.
3. Tap `Analyze Receipt`.
4. Review vendor, amount, type, and notes.
5. Tap `Upload Receipt`.
