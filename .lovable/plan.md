

## Plan: Remove Starter Pack from the entire product

### Scope
Delete all Starter Pack pages, components, hooks, types, admin page, navigation links, SEO routes, and any text references across the app.

### Files to DELETE (12 files)
- `src/pages/StarterPackHome.tsx`
- `src/pages/StarterPackBuild.tsx`
- `src/pages/StarterPackLead.tsx`
- `src/pages/admin/AdminStarterPack.tsx`
- `src/types/starterpack.ts`
- `src/hooks/useStarterPackResources.ts`
- `src/hooks/useSecureResourceAccess.ts`
- `src/components/starterpack/StarterPackHero.tsx`
- `src/components/starterpack/StarterPackCTA.tsx`
- `src/components/starterpack/StarterPackBreadcrumb.tsx`
- `src/components/starterpack/PathCard.tsx`
- `src/components/starterpack/PathOverview.tsx`
- `src/components/starterpack/ResourceCard.tsx`
- `src/components/starterpack/ResourceGrid.tsx`
- `src/components/starterpack/StepperRoute.tsx`
- `src/components/starterpack/HowItWorksSection.tsx`
- `src/components/starterpack/WhatIsProductPrepa.tsx`
- `src/components/starterpack/index.ts`

### Files to EDIT

1. **`src/App.tsx`** — Remove StarterPack lazy imports, and all 3 user routes (`/starterpack`, `/starterpack/build`, `/starterpack/lead`) + admin route (`starterpack`)

2. **`src/constants/navigation.ts`** — Remove the Starter Pack entry from `extraItems` array and the `Rocket` import

3. **`src/components/admin/AdminSidebar.tsx`** — Remove the "Starter Pack" sidebar entry and `Rocket` import

4. **`src/components/layout/LandingHeader.tsx`** — Remove the "Starter Pack" button (desktop) and mobile menu link, and `Rocket` import

5. **`src/pages/Index.tsx`** — Remove the full-width Starter Pack band section

6. **`src/pages/Planes.tsx`** — Remove "Acceso al Starter Pack completo" from Premium plan features list

7. **`src/pages/Courses.tsx`** — Remove the "Explorar Starter Pack" link/button

8. **`src/seo/routes.ts`** — Remove the 3 SEO route entries (`/starterpack`, `/starterpack/build`, `/starterpack/lead`)

9. **`supabase/functions/get-resource-access/index.ts`** — Remove the Starter Pack comment (keep the PREMIUM_PLANS logic as it serves other purposes)

