# AI-Powered Alcohol Label Verification App - Requirements Checklist

**Project Timeline:** ~1 day
**Objective:** Build a full-stack web application simulating TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process using AI/OCR to verify label images match form data.

---

## CORE DELIVERABLES

### Submission Requirements
- [ ] GitHub repository link (or similar platform)
- [ ] Live deployed application URL
- [ ] README file with local run instructions
- [ ] README includes setup steps
- [ ] README includes installation commands
- [ ] README includes requirements/dependencies
- [ ] README includes environment variable setup with sample dummy values
- [ ] Documentation of which OCR/AI tools used
- [ ] Documentation of key assumptions made
- [ ] Documentation of key decisions made
- [ ] Documentation of known limitations
- [ ] Documentation explaining WHY you chose certain solutions (thought process)
- [ ] If tests exist, instructions on how to run them
- [ ] (Optional) Screenshots or video/gif of app in action
- [ ] Submission email/message containing: repo link, deployed app link, additional notes

---

## 1. FORM INPUT REQUIREMENTS

### Required Form Fields
- [ ] **Brand Name** field - text input (e.g., "Old Tom Distillery")
- [ ] **Product Class/Type** field - text input (e.g., "Kentucky Straight Bourbon Whiskey", "Vodka", "IPA")
- [ ] **Alcohol Content** field - ABV percentage (can accept as percentage or number, e.g., "45%")
- [ ] **Net Contents** field - volume (e.g., "750 mL", "12 fl oz") - **OPTIONAL FOR MVP**
- [ ] (Bonus) **Other Info** fields - Manufacturer/Bottler Name & Address, Warnings

### Form UX Requirements
- [ ] Each field must be clearly labeled
- [ ] Use appropriate input types (text for names, number or text for ABV)
- [ ] Include image upload option in form

---

## 2. IMAGE UPLOAD REQUIREMENTS

### Upload Functionality
- [ ] Allow user to upload image file
- [ ] Can implement as `<input type="file">` HTML element OR drag-and-drop area
- [ ] Must allow user to select image from their computer
- [ ] Support JPEG format
- [ ] Support PNG format
- [ ] Support other common image formats (GIF, WebP, etc.)

---

## 3. BACKEND OCR/AI PROCESSING REQUIREMENTS

### OCR Implementation
- [ ] Use OCR library or service (not required to write from scratch)
- [ ] Examples acceptable: Tesseract.js, pytesseract, Google Vision API, AWS Textract, OpenCV, JavaScript OCR libraries
- [ ] If using external API, must use one with free tier available
- [ ] Must NOT expose sensitive API keys in code
- [ ] Backend receives uploaded image
- [ ] Run OCR/text extraction on image
- [ ] Extract text from label image

### Verification Checks (Compare Extracted Text to Form)
- [ ] Check if **Brand Name** from form appears in extracted text (exactly as provided)
- [ ] Check if **Product Class/Type** from form appears in extracted text (exact or very close/identical)
- [ ] Check if **Alcohol Content** appears in extracted text (look for number with "%" matching form)
- [ ] Check if **Net Contents** appears in extracted text (look for volume like "750 mL" or "12 OZ") - if implemented
- [ ] (Bonus) Check if **"GOVERNMENT WARNING"** phrase appears in extracted text
- [ ] (Bonus) Check if portions of warning text are present

### Text Comparison Rules
- [ ] Implement basic text normalization (e.g., ignore case differences)
- [ ] Handle common OCR errors (use judgment)
- [ ] Flag obvious mismatches (completely different brand names or numbers)
- [ ] Allow minor formatting differences (e.g., "Alc 5% by Vol" in image vs "5%" in form)
- [ ] **MUST document matching assumptions** (e.g., "match is case-insensitive", "alcohol percentage must match exactly as a number")

---

## 4. VERIFICATION & RESULTS DISPLAY REQUIREMENTS

### Success Case
- [ ] Display success message when all key fields match
- [ ] Example message: "✓ The label matches the form data. All required information is consistent."
- [ ] Show green check or success visual indicator

### Failure Case
- [ ] Display failure message when mismatches or missing info found
- [ ] Example message: "✗ The label does not match the form."
- [ ] **MUST list specifics on what didn't match**
- [ ] Example specific messages should include:
  - [ ] Brand name mismatch: "Brand name on label ('Old Tom Distillery') does not match the form input ('Tom's Distillery')."
  - [ ] Alcohol content mismatch: "Alcohol content on label (8.0%) differs from form (5.0%)."
  - [ ] Missing warning: "Government warning text is missing from the label."
- [ ] **MUST report ALL discrepancies, not just stop at first one**

### Error Handling
- [ ] Handle case where image couldn't be processed
- [ ] Handle case where OCR found no text
- [ ] Handle case where image was too low-quality
- [ ] Display error message for unreadable images
- [ ] Example message: "⚠ Could not read text from the label image. Please try a clearer image."

### Results UX Requirements
- [ ] Handle both success AND failure states gracefully
- [ ] If everything matches, user sees success indicator
- [ ] If not matching, user knows exactly WHY
- [ ] List each field check outcome to show what app did
- [ ] Demonstrate thoroughness in verification (like TTB would review and point out all issues)

---

## 5. USER INTERFACE & UX REQUIREMENTS

### General Design
- [ ] UI should be reasonably pleasant and clear
- [ ] Simple, clean design is fine (not primarily a design test)
- [ ] Use logical layout for form
- [ ] Group related fields
- [ ] Use proper labels for all inputs

### User Flow
- [ ] After submission, show results clearly
- [ ] Can display results on same page below form OR navigate to results page (your choice)
- [ ] Allow user to easily try another image without refilling form from scratch
- [ ] Allow user to edit form if things didn't match

### Visual Indicators
- [ ] Include visual cues like ✓ or ✗ for match/mismatch
- [ ] OR use colored text for match/mismatch
- [ ] Enhance clarity with visual design
- [ ] (Bonus) Highlight portions of image where text was found

### Sample UI Pattern (Suggestion from PDF)
- [ ] Could implement: Single page app with form on left, image preview on right
- [ ] Could implement: Below form/image, panel with checklist of each item (Brand, ABV, etc.) marked "Matched" or "Not Found/Mismatch"

---

## 6. TECHNICAL CONSTRAINTS

### Technology Stack
- [ ] Free to use ANY programming languages or frameworks
- [ ] Frontend options: HTML/CSS/JavaScript, React, Vue, or any framework
- [ ] Backend options: Node.js, Python (Flask/FastAPI/Django), etc.
- [ ] Full-stack frameworks like Next.js are fine
- [ ] Simple server-rendered approach is fine
- [ ] **Requirement: end result must be a web-accessible app**
- [ ] Use what you're comfortable with

### AI Libraries/Services
- [ ] Can choose any libraries or APIs for OCR and image processing
- [ ] **Encouraged to use off-the-shelf solutions** (don't write OCR from scratch)
- [ ] Keep time constraint in mind when choosing
- [ ] Examples: Tesseract.js, pytesseract (Tesseract OCR), JavaScript OCR libraries
- [ ] If using external API, ensure it's free or has free tier
- [ ] **Must not expose sensitive keys in code**

### Deployment
- [ ] Want to see app deployed live
- [ ] Can use: Vercel, Netlify, Heroku, Render, or any hosting of your choice
- [ ] App doesn't need to handle heavy traffic
- [ ] Free tier or personal deployment is fine
- [ ] **If deployment problematic, provide clear instructions to run locally**
- [ ] **Deployment must be same version as code in repo**
- [ ] (Note: Fine if only up during evaluation period, can take down later)
- [ ] Include credentials if needed (not likely for this project)

### Data Persistence
- [ ] **NO requirement to use database**
- [ ] **NO requirement to save data between sessions**
- [ ] Can keep it simple - form submission triggers check, results shown immediately
- [ ] Optional: demonstrate state handling if preferred, but not required

### Testing
- [ ] Formal unit tests are optional given short timeline
- [ ] Welcome to include some if it helps demonstrate skills
- [ ] **At minimum: manual testing with different images for basic scenarios**

---

## 7. TESTING REQUIREMENTS

### Test Scenarios to Cover
- [ ] Test scenario: matching info (all fields match perfectly)
- [ ] Test scenario: mismatched info (one or more fields don't match)
- [ ] Test scenario: missing fields on label
- [ ] Test scenario: unreadable image (blurry, corrupted)
- [ ] Test scenario: multiple discrepancies (show that ALL are reported)

### Test Images
- [ ] Create or source test label images
- [ ] Can use AI image generation tools for test images
- [ ] Can use simple graphic design for test images
- [ ] Test with different product types (optional - beer, wine, spirits)
- [ ] Ensure test images contain necessary text clearly enough

---

## BONUS FEATURES (OPTIONAL - ONLY AFTER CORE IS COMPLETE)

### 1. Detailed Compliance Checks
- [ ] Expand verification to cover more TTB rules
- [ ] Ensure government warning exists AND is exactly as required
- [ ] Check exact wording of warning statement
- [ ] Check capitalization (e.g., "Surgeon General")
- [ ] Store expected warning text and compare to OCR output
- [ ] Flag any discrepancies in warning text
- [ ] Verify alcohol content descriptors for wine (e.g., "Table Wine" if no ABV given)
- [ ] Requires deeper domain knowledge - only attempt what comfortable with

### 2. Multiple Product Types
- [ ] Handle different beverage types (Beer, Wine, Distilled Spirits)
- [ ] Different required fields per type
- [ ] Different checks per type
- [ ] Wine labels: sulfite declaration
- [ ] Beer labels: ingredients list
- [ ] Include dropdown to select beverage category
- [ ] Adjust which fields/checks are applied based on selection
- [ ] Show adaptability to different requirements

### 3. Image Highlighting
- [ ] Make results more interactive
- [ ] Highlight on label where each piece of info was found
- [ ] Draw rectangles around detected brand name on image
- [ ] Draw rectangles around detected ABV on image
- [ ] Capture OCR coordinates OR use image editing library to overlay highlights
- [ ] Great visual touch if can implement

### 4. Refinement of OCR Results
- [ ] Logic to handle OCR errors more smartly
- [ ] Handle "O" misread as "0"
- [ ] Handle missing small characters
- [ ] Fuzzy or tolerant comparison for minor errors
- [ ] Techniques: edit distance algorithm
- [ ] Techniques: regex matching
- [ ] Ignore spaces when comparing
- [ ] Ignore punctuation when comparing

### 5. Polish and UX Improvements
- [ ] Single-page application with async form submission (AJAX)
- [ ] Page doesn't fully reload on submit
- [ ] Loading indicators while image is being processed
- [ ] Professional design (Bootstrap styling or any CSS framework)
- [ ] Well-polished app beyond basic requirements
- [ ] Smooth transitions and animations

### 6. Automated Tests
- [ ] Automated tests for text-matching logic
- [ ] End-to-end tests using Selenium or Playwright
- [ ] Few tests demonstrating testing skills
- [ ] Not expected for one-day project but impressive bonus

### Bonus Documentation
- [ ] **Mention any bonus features in documentation so they're not overlooked**

---

## EVALUATION CRITERIA

### Correctness & Completeness
- [ ] App fulfills core requirements
- [ ] Accurately detects matches vs mismatches between form and image
- [ ] Includes all required fields and checks

### Code Quality
- [ ] Well-organized code
- [ ] Readable code
- [ ] Maintainable code
- [ ] Clear module structure
- [ ] Understandable variable names
- [ ] Not overly complex
- [ ] Uses best practices as time allows

### Technical Choices
- [ ] Appropriate tools/libraries chosen for task
- [ ] Using OCR library makes sense (not building from scratch)
- [ ] Not using overly complex solution where simple approach suffices
- [ ] Demonstrates good judgment
- [ ] Can justify why chosen approach made sense
- [ ] Modern frameworks or vanilla code - either justified

### UI/UX and Polish
- [ ] Don't expect design award-winning app in one day
- [ ] User-friendly interface
- [ ] Clear messages and instructions
- [ ] Proper error handling
- [ ] Nice touches noted and appreciated

### Followed Instructions
- [ ] Includes all items asked for in requirements
- [ ] README provided as requested
- [ ] Deployment provided (or clear local instructions)
- [ ] Shows attention to requirements
- [ ] **This is important: shows you can pay attention to requirements**

### Creativity & Bonus Efforts
- [ ] Any extra mile features will be noted
- [ ] Creative approaches taken
- [ ] Can think for yourself
- [ ] Add sensible improvements without explicit instructions
- [ ] **Core requirements must be solid before spending time on extras**

---

## SCOPE & TIME MANAGEMENT

### Time Constraints
- [ ] Project intended to be completed in about **ONE DAY**
- [ ] Scope solution accordingly
- [ ] More interested in: approach, code quality, how you handle requirements
- [ ] Less interested in: huge, overly complex system

### Prioritization
- [ ] **Keep it as simple as possible**
- [ ] Can note how you'd extend it if given more time
- [ ] Don't expect perfection given time constraint
- [ ] Use best judgment on where to focus efforts
- [ ] **Better to have: working core application with clear code**
- [ ] **Worse to have: overly ambitious project that is incomplete or buggy**

### Trade-offs
- [ ] If had to make trade-offs due to time, mention in notes
- [ ] If cut optional parts due to time, document why
- [ ] Focus on solid core before any extras

---

## SAMPLE TEST DATA (From PDF Example)

### Example Distilled Spirits Label Should Contain:
- **Brand Name:** "OLD TOM DISTILLERY"
- **Class/Type:** "Kentucky Straight Bourbon Whiskey"
- **Alcohol Content:** "45% Alc./Vol. (90 Proof)"
- **Net Contents:** "750 mL"
- **Other:** Bottler's statement
- **Other:** Government Warning text at bottom

### Corresponding Form Inputs for Testing:
- **Brand Name** = Old Tom Distillery
- **Class** = Kentucky Straight Bourbon Whiskey
- **Alcohol Content** = 45%
- **Net Contents** = 750 mL

### Expected Behavior:
App should confirm all fields are present in image text and match form inputs, resulting in success message.

---

## REFERENCE LINKS

- TTB Official Site: https://www.ttb.gov
- TTB Guidelines Document: https://www.ttb.gov/media/66695/download?inline

---

## NOTES

- This checklist represents EVERY requirement from the take-home project PDF
- Check off items as you complete them
- Core requirements MUST be completed before attempting any bonus features
- Document all assumptions, decisions, and trade-offs
- Focus on working code over complexity
- Remember: ~1 day time constraint, scope accordingly
