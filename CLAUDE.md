Wardrobe app

The purpose of this app is to document pieces that the user has in their closet, and easily allow them to virtually 'create' new outfits, similar to Polyvore.

**Layout**
The main pages are:

- Pieces - a grid view of all of the items that the user has in their wardrobe (in src/data/wardrobe.ts).
- Outfits - the collages that the user has created from their pieces
- Builder - A drag and drop editor where the user can drag pieces from the grid on the left (the wardrobe) onto the collage on the right (the outfit). The user should be able to resize and move the individual items.

**Code principles**

- Use typescript and well documented types
- Use vanilla CSS and stylesheets. Do not use inline styles
- Use functional components
- Destructure imports when possible (eg. import { foo } from 'bar')
- Use ES modules (import/export) syntax, not CommonJS (require)
- Use local storage for now, with the ability to easily transition to a database later if necessary

**Aesthetics**

The aesthetic of the site should be similar to Khaite or The Row. Minimalist and neutral.
The header should be sticky and relatively thin.
