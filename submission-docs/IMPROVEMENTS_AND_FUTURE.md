# Future Improvements

This document outlines potential improvements beyond the MVP scope.

---

## Production Readiness

### Database & Persistence
- Currently all submissions are lost on server restart
- Would add MongoDB or PostgreSQL for permanent storage
- Export functionality for compliance records

### Security & Authentication
- Current admin credentials are hardcoded (admin/admin123)
- Need proper authentication system with password hashing
- API rate limiting and input sanitization for production use
- CORS policy needs to be locked down (currently accepts all origins)

### API Improvements
- Add API versioning (e.g., `/api/v1/...`)
- Implement pagination for admin submissions list
- Better error handling and standardized error responses

---

## OCR & Verification Accuracy

### Image Quality
- Pre-submission image quality checker (warn if blurry/dark)
- Support for image rotation/cropping before upload
- Better handling of low-quality scans

### Text Matching
- **Enhanced context-aware matching**: Government warning now uses context isolation (searches within warning section only)
  - Could extend this approach to other fields (brand area, alcohol content area)
  - Example: "40%" and "ABV" should be close to each other, not separate sections
  - Brand name words should appear as a phrase, not scattered across label
- **Positional matching**: Use bounding box coordinates to verify field locations
  - Brand name typically at top, government warning at bottom
  - Would reduce false positives significantly
- Consider multiple OCR providers as fallback (AWS Textract, Azure CV)
- Per-field confidence scoring to highlight uncertain matches

### Label Layout Recognition
- Current approach treats the entire label as a text blob
- Could use ML to identify specific label regions (brand area, warnings, etc.)
- Would improve accuracy for complex multi-section labels

---

## User Experience

### For Label Submitters
- Email notifications when submission is reviewed
- Track submission status by ID (or tracking system in general)
- Auto-save form data (resume if browser closes)
- Better progress indicators showing OCR stages

### For Admin Reviewers
- Search submissions by brand name, date, or ID
- Bulk approve/reject for similar submissions
- Quick-select templates for common rejection reasons
- Manual override when OCR misreads correct labels

---

## Technical Enhancements

### Component Library (Big one)
- Currently all UI components are custom-built
- Would use Angular Material or PrimeNG for future iterations
- Reduces maintenance and improves consistency

### Code Organization
- Could create shared utility components for forms and buttons
- Consider design system for color tokens and spacing

### Performance
- Current OCR is synchronous (blocks until complete)
- Would implement job queue for async processing
- Add caching layer for repeated images
- WebSocket for real-time progress updates

### Testing & Monitoring
- 173 backend unit tests cover core logic
- Need E2E tests for critical user flows
- Add error tracking for production issues
- Application logging for debugging

---

## Deployment

### Current Setup
- Deployed on Vercel with serverless functions
- Works for demo but has limitations for production scale

### Production Considerations
- Horizontal scaling support with load balancer
- Environment variable management (AWS Secrets Manager)
- Uptime monitoring and alerting

---

## Feature Extensions

### Batch Processing
- Unlimited images per submission (currently limited to 2)
- CSV import for bulk verification
- Export results to spreadsheet
- Batch approve/reject operations

### Image Quality & Preprocessing
- Image rotation/cropping tools before submission
- Automatic brightness/contrast adjustment
- Image quality warnings (blur detection, resolution checks)
- Support for PDF uploads (extract images from multi-page PDFs)

### Compliance Features
- Print approval certificates for passing labels
- Historical tracking (see all versions of a label)
- Regulatory rule updates (TTB requirement changes)

### Analytics
- Admin dashboard showing approval rates
- Common failure patterns
- Processing time metrics

---

## Notes

This is an MVP demonstrating the core label verification concept. Focus areas for next iteration:

1. **Make it production-ready** - Database, proper auth, security hardening
2. **Improve OCR accuracy** - Better image preprocessing, multiple providers, better tuning
3. **User notifications** - Email system for status updates
4. **Search and bulk operations** - Help admins work more efficiently

All technical details and architectural decisions are documented in [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md).
