# Office Relief AI

Demo web app for preliminary office syndrome screening and rehab guidance.

## Current Flow

- `/` landing page
- `/login` mock login/register
- `/persona` patient basic profile
- `/assessment` screening questions
- `/body-map` pain area selection
- `/result` preliminary result + rehab cards

## Run Frontend

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Notes

- The current product direction is office syndrome screening, not the old food-scan prototype.
- Some backend files are still kept as legacy prototype code and are not used by the current frontend flow.
