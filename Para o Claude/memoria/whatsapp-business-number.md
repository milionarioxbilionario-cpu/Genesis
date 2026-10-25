---
name: whatsapp-business-number
description: "Founder's WhatsApp Business number for Genesis alerts and what is still missing to send from it"
metadata:
  node_type: memory
  type: project
  originSessionId: 032772c7-7233-4df2-8c74-2e48ba888268
  modified: 2026-10-19T02:21:09.361Z
---

On 2026-10-19 the founder gave the WhatsApp Business number **+258849461056** for Genesis's alerts (Fase 10.2: debtor reminders 7/1/0 days, daily list for the owner, stock minimum).

The backend sends through Twilio (`backend/src/utils/whatsapp.js`, env `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`). The number alone is not enough: it still needs a Twilio account with the number registered as a WhatsApp sender (Meta Business), and approved message templates. A message the business starts outside the 24-hour window must use a template; the current code sends free text (`Body`).

**Why:** the founder may think giving the number turns sending on.
**How to apply:** don't put the number in the prod env or claim WhatsApp works until the Twilio credentials exist and a real send has been proven. Related: [[autonomous-phase-runs]]
