# Wardrobe

A personal wardrobe management app for cataloging your clothes and creating outfits.

## What it does

**Pieces** - Keep track of everything in your wardrobe. Add items by pasting a product URL (the app will try to pull in details automatically) or enter them manually. Click any piece to see its details, edit the description, and see which outfits it's part of.

**Outfits** - Browse the outfit collages you've created.

**Builder** - Drag and drop pieces from your wardrobe onto a canvas to create outfit collages. Resize and arrange items however you want.

**Stylist** - Chat with an AI style assistant that knows your wardrobe. Ask for outfit suggestions, get advice on what to wear, or just talk through styling ideas. The assistant remembers your preferences over time.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file with your Gemini API key:

   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

3. Start the dev server:
   ```
   npm start
   ```
