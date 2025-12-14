# Frontend Changes for 3NF Database Migration (Advertisers)

**Date:** December 14, 2025  
**Status:** ✅ COMPLETED  
**Migration Impact:** Advertisement Management Feature

---

## Summary of Changes

The backend database was normalized to 3rd Normal Form (3NF), extracting advertiser information into a separate table. The frontend has been updated to work with the new API structure.

---

## Files Modified

### Types
1. **`src/types/advertiser.ts`** (NEW)
   - Added `Advertiser` interface with fields: `id`, `name`, `contact_phone`, `contact_email`, `address`

2. **`src/types/index.ts`** (UPDATED)
   - Changed `Advertisement.advertiser_name` and `Advertisement.advertiser_contact` → `Advertisement.advertiser: Advertiser` (nested object)
   - Changed `CreateAdInput.advertiser_name` and `CreateAdInput.advertiser_contact` → `CreateAdInput.advertiser_id: number`
   - Updated `DisplayAdvertisement` to include optional `advertiser?: Advertiser`

### API Services
3. **`src/services/api.ts`** (UPDATED)
   - Added new `advertisersApi` with methods:
     - `getAdvertisers(params?)` - List all advertisers (with search)
     - `getAdvertiser(id)` - Get single advertiser details
     - `createAdvertiser(data)` - Create new advertiser
     - `updateAdvertiser(id, data)` - Update advertiser info
     - `deleteAdvertiser(id)` - Delete advertiser (if no ads exist)

### UI Components
4. **`src/components/modals/AdModal.tsx`** (UPDATED)
   - Removed text inputs for `advertiser_name` and `advertiser_contact`
   - Added dropdown `<select>` that loads advertisers from API
   - Added inline "+" button to create new advertiser via quick prompt flow
   - Updated Zod schema: replaced `advertiser_name`/`advertiser_contact` with `advertiser_id` (number, required)
   - Updated form defaults and reset logic to use `advertiser_id`

5. **`src/pages/AdsPage.tsx`** (UPDATED)
   - Updated search filter: `ad.advertiser_name` → `ad.advertiser?.name`
   - Updated display card: `ad.advertiser_name` → `ad.advertiser?.name`
   - Create/edit mutations now send `advertiser_id` instead of advertiser name/contact

### Other Files
6. **`src/pages/SMDSimulatorPage.tsx`** (NO CHANGES NEEDED)
   - `transformAds()` function doesn't reference advertiser fields, so no changes required

---

## API Changes

### New Endpoints (Advertisers)
```typescript
GET    /api/advertisers/          // List advertisers (?search=...)
POST   /api/advertisers/          // Create advertiser
GET    /api/advertisers/{id}/     // Get advertiser details
PATCH  /api/advertisers/{id}/     // Update advertiser
DELETE /api/advertisers/{id}/     // Delete advertiser (only if no ads)
```

### Modified Endpoints (Advertisements)
```typescript
// OLD REQUEST (POST /api/advertisements/)
{
  "title": "...",
  "content_url": "...",
  "media_type": "image",
  "duration_seconds": 10,
  "advertiser_name": "ABC Corp",      // ❌ REMOVED
  "advertiser_contact": "+92300..."   // ❌ REMOVED
}

// NEW REQUEST (POST /api/advertisements/)
{
  "title": "...",
  "content_url": "...",
  "media_type": "image",
  "duration_seconds": 10,
  "advertiser_id": 5                  // ✅ REQUIRED (must exist)
}

// OLD RESPONSE (GET /api/advertisements/)
{
  "id": 1,
  "title": "...",
  "advertiser_name": "ABC Corp",      // ❌ REMOVED
  "advertiser_contact": "+92300..."   // ❌ REMOVED
}

// NEW RESPONSE (GET /api/advertisements/)
{
  "id": 1,
  "title": "...",
  "advertiser": {                     // ✅ NESTED OBJECT
    "id": 5,
    "name": "ABC Corp",
    "contact_phone": "+92300...",
    "contact_email": "ads@abc.com"
  }
}
```

---

## User Workflow Changes

### Creating an Advertisement (Before)
1. Admin fills out ad form
2. Types advertiser name manually (risk of typos/duplicates)
3. Types contact info manually
4. Submits ad

### Creating an Advertisement (After - 3NF)
1. Admin fills out ad form
2. **Selects existing advertiser from dropdown** (no typos, consistent)
3. If advertiser doesn't exist, clicks **"+"** button to create one inline via quick prompts
4. Newly created advertiser auto-selected in dropdown
5. Submits ad with `advertiser_id`

### Benefits
✅ **No duplicate advertisers** (e.g., "ABC Corp" vs "ABC Corporation")  
✅ **Update advertiser contact once** → all their ads reflect the change  
✅ **Can track all ads per advertiser** easily  
✅ **Better data consistency** (3NF compliance)

---

## Testing Checklist

- [x] Advertisement list page loads without errors
- [x] Ad cards display `advertiser.name` correctly
- [x] Search by advertiser name works
- [x] Create ad form has advertiser dropdown (not text input)
- [x] Advertiser dropdown populates from API
- [x] "+" button creates new advertiser inline and selects it
- [x] Can create ad with selected `advertiser_id`
- [x] Edit ad form shows current advertiser in dropdown
- [x] Can change advertiser via dropdown when editing ad
- [x] Build passes: `npm run build` ✅
- [x] No TypeScript errors
- [x] No console errors on Ads page

---

## Validation Rules

### Advertiser Creation
- `advertiser_name`: Required, min 2 characters, must be unique
- `contact_email`: Optional, must be valid email format
- `contact_phone`: Optional, free text
- `address`: Optional

### Advertisement Creation
- `advertiser_id`: Required, must reference existing advertiser
- Backend validates advertiser exists (returns 400 if not found)

### Advertiser Deletion
- Can only delete advertiser if they have **ZERO** advertisements
- Returns 409 Conflict if advertiser has active ads

---

## Migration Notes

### Breaking Changes
⚠️ **This is a breaking change for the Ads feature.**  
Old advertisement payloads with `advertiser_name`/`advertiser_contact` will be **rejected** by the backend.

### Backwards Compatibility
❌ **None.** Frontend must be deployed alongside backend migration.

### Data Migration
Backend team handled migrating existing `advertiser_name`/`advertiser_contact` data to the new `advertisers` table. Frontend now consumes the new structure.

---

## Future Enhancements (Optional)

### Advertiser Management Page
Currently, advertisers can only be created inline via the "+" button in AdModal. For better management, consider adding:

1. **New Page**: `/advertisers`
   - List all advertisers in a table/card view
   - Search by name/email/phone
   - Edit advertiser details
   - Delete advertiser (if no ads)
   - View all ads for each advertiser

2. **Navigation**:
   - Add "Advertisers" link to sidebar (optional, admin-only)

3. **Implementation** (if needed):
   ```typescript
   // Create src/pages/AdvertisersPage.tsx
   // Similar to AdsPage structure
   // Use advertisersApi.getAdvertisers(), createAdvertiser(), etc.
   ```

---

## Troubleshooting

### Issue: "advertiser_name is undefined"
**Solution:** Update code to use `ad.advertiser.name` (nested object)

### Issue: "POST /api/advertisements/ returns 400: advertiser_id is required"
**Solution:** Ensure form sends `advertiser_id` (number) instead of `advertiser_name` (string)

### Issue: "Cannot create ad - Advertiser with this ID does not exist"
**Solution:** First create the advertiser via `advertisersApi.createAdvertiser()`, then use its ID

### Issue: "Advertiser dropdown is empty"
**Solution:** Check that `advertisersApi.getAdvertisers()` is being called and returning data. Verify backend `/api/advertisers/` endpoint is working.

---

## Support

For questions or issues:
- **Backend API Questions:** Backend Team Lead
- **Database Migration Issues:** Database Admin
- **Frontend Integration Help:** Frontend Team Lead

Slack Channels: `#database-migration`, `#frontend-dev`

---

## Summary

**Status:** ✅ All required changes completed and tested  
**Build:** ✅ Passing  
**TypeScript:** ✅ No errors  
**Ready for Production:** ✅ YES (deploy with backend)

The frontend now fully supports the 3NF database structure. Advertisers are managed as separate entities, and advertisements reference them via `advertiser_id`. This improves data consistency, reduces duplication, and makes the system easier to maintain.
