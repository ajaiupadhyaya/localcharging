# CHARGELOCAL --- Product + Engineering Handoff

**Working title:** ChargeLocal\
**One-line thesis:** Turn unused residential EV chargers into a trusted,
reservation-based charging network that sits alongside public fast
charging.

> Build this like a real mobility product, not a CRUD marketplace. The
> core experience should feel closer to Apple Maps / Airbnb / Uber than
> a generic SaaS dashboard.

------------------------------------------------------------------------

## 0. Agent directive

You are the coding agent responsible for turning this document into a
polished, production-minded application.

**Do not build a vibecoded UI.**

Avoid: - generic gradient hero sections - excessive rounded cards -
random glassmorphism - huge headings with meaningless marketing copy -
icon grids - dashboard-with-12-cards layouts - fake statistics -
unnecessary badges/pills - default Tailwind-looking UI - giant modals
for every interaction - putting every piece of information inside a card

Prefer: - map-first information architecture - typography-led
hierarchy - restrained color - purposeful motion - strong spatial
composition - dense but legible map controls - native-feeling
sheets/drawers - clear states - real-world language - excellent
empty/loading/error states - subtle visual differentiation between
public infrastructure and residential chargers

The product should feel like a serious mobility application designed by
a strong product team.

------------------------------------------------------------------------

# 1. Product concept

ChargeLocal is a two-sided EV charging network.

A homeowner can publish their residential EV charger as a private/shared
charging location.

A driver can: 1. Open the map. 2. See nearby chargers. 3. See public
fast chargers alongside residential chargers. 4. Filter by connector,
charging speed, availability, price, accessibility, and other
constraints. 5. Select a residential charger. 6. View the exact charging
instructions without exposing unnecessary private information. 7.
Request a charging session. 8. Wait for homeowner approval. 9. Navigate
there. 10. Arrive and follow parking/charging instructions. 11. Start
the session. 12. End the session. 13. Rate/report the experience.

The homeowner can: 1. Create a charger listing. 2. Define charger specs.
3. Define availability. 4. Define pricing. 5. Define parking
instructions. 6. Decide whether requests are automatically approved or
manually approved. 7. Receive requests. 8. Approve, decline, or suggest
another time. 9. See active/upcoming sessions. 10. Pause the listing.
11. See earnings and usage. 12. Build reputation.

The important conceptual distinction:

**Public chargers are infrastructure. Residential chargers are people.**

The UI should make that difference visible without making residential
charging feel unsafe or informal.

------------------------------------------------------------------------

# 2. Product positioning

Do not position ChargeLocal as "Airbnb for EV chargers" in the UI.

Internally, that analogy is useful.

Externally, the product should feel like:

> **A local charging layer for your EV.**

Public charging is sometimes crowded, expensive, broken, or
inconvenient.

Residential charging can be: - closer - cheaper - quieter - more
reliable - more human - available in places where infrastructure is
sparse

ChargeLocal fills the gap between "I need a charger" and "there happens
to be a public station nearby."

------------------------------------------------------------------------

# 3. Product principles

## 3.1 The map is the product

The home screen should not be a marketing landing page.

It should immediately answer:

**"Where can I charge?"**

## 3.2 Availability must be trustworthy

Never imply that a residential charger is available unless the system
has a current availability state.

Use explicit states:

-   Available
-   Request required
-   Pending approval
-   Reserved
-   Charging
-   Temporarily unavailable
-   Offline
-   Unknown

## 3.3 Privacy is a product feature

Residential charger locations must NOT expose a precise home address
before a booking is accepted.

Before approval: - show approximate location / neighborhood - show
estimated driving distance - show charger details - show host profile -
show parking description - hide exact house number

After approval: - reveal exact address - provide arrival instructions -
optionally provide a gate/door code only shortly before the session

Never expose a home's exact coordinates through public APIs or
unauthenticated map payloads.

## 3.4 Human approval is part of the experience

A request is not a generic "booking."

It is a lightweight social contract:

**Driver:** "Can I charge here?"

**Host:** "Yes --- I've got you."

That relationship should feel intentional.

## 3.5 Public and residential infrastructure should coexist

The map should combine: - Tesla / Supercharger-type fast charging - DC
fast charging - Level 2 public charging - residential ChargeLocal
chargers - potentially destination chargers

Do not pretend ChargeLocal replaces public charging.

It complements it.

------------------------------------------------------------------------

# 4. Brand direction

Working name: **ChargeLocal**

Possible future names: - ChargeLocal - NeighborCharge - ChargeNear -
PlugLocal - Current - Relay - PorchCharge

Use **ChargeLocal** for the first build unless a repository already
establishes another name.

### Visual personality

Think:

**modern mobility × neighborhood trust × understated technical
precision**

Not: - eco startup - crypto - fintech - generic SaaS

### Palette

Base: - near-black / graphite - warm white - neutral gray

Primary accent: - electric blue/indigo OR a restrained electric green

Use the accent sparingly: - active charger state - primary CTA - route
highlight - successful booking - charging state

Avoid making the entire UI blue/green.

### Typography

Use a high-quality modern sans-serif.

Good options: - Inter - Geist - SF Pro if native Apple platform - IBM
Plex Sans if a more technical character is desired

Typography should do most of the hierarchy work.

### Shape language

Moderately rounded.

Suggested: - 10--14px controls - 14--18px sheets/panels - 20px+ only for
large bottom sheets or major surfaces

Do not put a 24px radius on everything.

### Shadows

Very restrained.

Prefer: - thin borders - map contrast - elevation through layering

over giant drop shadows.

------------------------------------------------------------------------

# 5. Primary navigation

Mobile:

-   Map
-   Activity
-   Host
-   Profile

Desktop:

Left: - logo - Map - Activity - Host

Right: - notifications - profile

The map remains visually dominant.

------------------------------------------------------------------------

# 6. Home / map experience

## Desktop

Layout:

``` text
┌────────────────────────────────────────────────────────────────────┐
│ ChargeLocal       Search destination...       Activity   Profile   │
├───────────────────────────────────────────────────────┬────────────┤
│                                                       │            │
│                                                       │ Charger    │
│                      MAP                              │ detail     │
│                                                       │ drawer     │
│                                                       │            │
│                                                       │            │
│                                                       │            │
└───────────────────────────────────────────────────────┴────────────┘
```

The map occupies roughly 65--75% of the screen.

A charger detail drawer occupies the remaining space.

Do NOT use a traditional sidebar with dozens of controls.

## Mobile

Full-screen map.

Bottom sheet: - collapsed: "12 chargers nearby" - half expanded: charger
list/detail - full expanded: complete charger detail

Controls float over the map.

------------------------------------------------------------------------

# 7. Map visual language

Use different visual primitives for different charger categories.

### Residential ChargeLocal charger

A distinctive house/plug marker.

Suggested: - circular marker - small plug symbol - accent ring when
available - subtle pulse ONLY when actively charging or newly available

### Public charger

Use a simpler plug/lightning marker.

### Fast charger

Visually emphasize speed, not brand.

Examples: - 250 kW - 150 kW - 50 kW

Do not make every public station look identical to residential.

### Selected station

Marker enlarges slightly and gains a directional/routing relationship to
the detail panel.

Avoid bouncing pins.

------------------------------------------------------------------------

# 8. Search

Search should support:

-   address
-   neighborhood
-   city
-   destination
-   charger network
-   charger name
-   host/listing name

Example:

> "I'm driving to Richmond"

Then show chargers along the route rather than simply around the
destination.

------------------------------------------------------------------------

# 9. Route-aware charging

This is a major differentiator.

The user can enter:

**Destination → Richmond, VA**

ChargeLocal computes:

-   current battery assumptions
-   route
-   charger options along route
-   estimated detour
-   estimated charging time
-   price
-   availability
-   reliability

Eventually:

> "Best stop: Sarah's Level 2 --- 4 min detour, \$0.18/kWh, likely
> available at 7:30 PM."

Do NOT make this feature mandatory for MVP, but architect the data model
so it can be added.

------------------------------------------------------------------------

# 10. Filters

Filters should be a horizontal, compact control row.

Core:

-   Any charger
-   Residential
-   Public
-   Fast
-   Available now

Expanded filter sheet:

### Connector

-   NACS / J3400
-   CCS
-   CHAdeMO
-   J1772
-   Other

### Charging speed

-   Any
-   Level 1
-   Level 2
-   DC Fast
-   50--100 kW
-   100--200 kW
-   200+ kW

### Price

-   Free
-   Under \$0.20/kWh
-   Under \$0.30/kWh
-   Any

### Access

-   Driveway
-   Garage
-   Parking lot
-   Street-adjacent

### Host preferences

-   Any
-   Appointment required
-   Instant approval
-   Pet-friendly
-   Covered
-   Accessible

------------------------------------------------------------------------

# 11. Charger detail screen

Residential charger detail:

``` text
[map/photo]

Alex's Home Charger
4.9 ★ · 18 sessions
~0.7 mi away

11.5 kW
Level 2
J1772
240V

$0.18 / kWh
or $5 flat session

Available today
Approval required

PARKING
Pull into the right side of the driveway.
Blue house. Charger is beside the garage.

ACCESS
Please keep the driveway clear.
No indoor access required.

HOST
Alex
18 successful sessions
Responds in ~4 min

[Request a charge]
```

Important:

Before approval: - do not show exact street number - do not reveal
sensitive access instructions - show enough information for a driver to
decide

------------------------------------------------------------------------

# 12. Request flow

Request screen should be extremely simple.

``` text
Charge with Alex

Today
6:30 PM → 8:30 PM

Vehicle
Tesla Model 3

Current charge
24%

Target
80%

Estimated energy
~38 kWh

Estimated cost
~$6.84

[Send request]
```

Optional message:

> "Hey Alex --- I'm passing through and need enough charge to get to
> Charlottesville."

This makes the interaction human.

------------------------------------------------------------------------

# 13. Homeowner approval flow

Notification:

``` text
New charging request

Jordan wants to charge
today, 6:30–8:30 PM

Tesla Model Y
~38 kWh requested

$6.84 estimated

"Passing through and need enough
charge to get to Charlottesville."

[Approve] [Decline]
```

If declined:

Offer: - decline - suggest another time

Example:

> "I'm free after 9 PM if that works."

This should feel like messaging, not customer support.

------------------------------------------------------------------------

# 14. Booking states

Implement a strict state machine.

``` text
REQUESTED
  ↓
APPROVED
  ↓
ARRIVING
  ↓
CHECKED_IN
  ↓
CHARGING
  ↓
COMPLETED
```

Alternative paths:

``` text
REQUESTED → DECLINED
REQUESTED → EXPIRED
APPROVED → CANCELLED
APPROVED → NO_SHOW
CHECKED_IN → CANCELLED
CHARGING → INTERRUPTED
CHARGING → COMPLETED
```

Every transition should have: - timestamp - actor - optional reason -
audit event

Never derive session state solely from UI.

------------------------------------------------------------------------

# 15. Active charging screen

When charging:

``` text
CHARGING

Alex's Home Charger

42%
██████████████░░░░░░

+18.4 kWh
~$3.31

Estimated completion
7:54 PM

Power
11.2 kW

[End session]
```

If the hardware cannot provide real-time telemetry, clearly label values
as estimates.

Never fake live telemetry.

------------------------------------------------------------------------

# 16. Host dashboard

Host mode should feel fundamentally different from a generic analytics
dashboard.

Home screen:

``` text
Your charger

● Available

Next booking
Jordan
Today · 6:30 PM

This month
12 sessions
$84.20 earned
112 kWh delivered

[Manage charger]
[View activity]
```

Secondary sections: - calendar - requests - earnings - charger
settings - listing preview - reliability - reviews

------------------------------------------------------------------------

# 17. Host onboarding

Do NOT make a giant form.

Use a guided sequence.

### Step 1

"Where is the charger?"

Use map/address confirmation.

### Step 2

"What charger do you have?"

Select: - Tesla Wall Connector - ChargePoint - Wallbox - Emporia -
Grizzl-E - Other

Or manually enter:

-   connector
-   maximum kW
-   voltage
-   amperage

### Step 3

"Where should the driver park?"

Options: - driveway - garage - parking pad - side of house - other

### Step 4

"How should drivers access it?"

-   open access
-   charger is outside
-   gate required
-   host meets driver

### Step 5

"When can people charge?"

Calendar: - weekdays - weekends - custom hours - blackout dates

### Step 6

"How do you want requests handled?"

-   Automatically approve
-   Ask me first

### Step 7

"How much do you want to charge?"

-   Free
-   per kWh
-   per session
-   hourly
-   custom

### Step 8

"Preview your listing"

Show exactly what drivers see.

------------------------------------------------------------------------

# 18. Listing photos

Encourage: 1. charger close-up 2. parking spot 3. approach from street

Never require: - interior house photos - identifiable family photos -
unnecessary personal information

Photo guidance should say:

> "Show drivers exactly where to go --- without showing your home
> interior."

------------------------------------------------------------------------

# 19. Pricing model

Support:

### Free

"\$0"

### Flat session

"\$5 / session"

### Energy

"\$0.18 / kWh"

### Time

"\$2 / hour"

Eventually: - minimum session fee - idle fee - cancellation fee -
dynamic pricing

For MVP, use one pricing method per listing.

------------------------------------------------------------------------

# 20. Payments

Design for Stripe Connect or an equivalent marketplace payment system.

Host: - connects payout account - receives payout

Driver: - stores payment method - authorizes estimated amount - final
charge calculated from session

MVP can initially use: - simulated payments - Stripe test mode

Do not build a fake payment flow that looks production-live.

------------------------------------------------------------------------

# 21. Public charging integration

The map should include public charging data.

Recommended initial data layer:

### Open Charge Map

Use as an initial public charging dataset.

Open Charge Map exposes charging-location data through its API and
supports POI retrieval and reference data. It has API-key and fair-use
requirements, so calls should be server-side, throttled, cached
appropriately, and attributed according to its terms.

Official docs: https://www.openchargemap.org/develop/api

### NREL / AFDC

For US alternative-fuel station data, evaluate NREL's Alternative Fuel
Stations API.

Do not hard-code station data.

### Future roaming

Architect toward OCPI.

OCPI supports: - locations - tariffs - sessions - CDRs - authorization -
reservations - real-time status - remote start/stop - smart charging

Current OCPI documentation should be treated as the source of truth for
future roaming integrations.

https://ocpi-protocol.com/

Important:

**Do not claim that Tesla, ChargePoint, Electrify America, EVgo, etc.
are directly integrated unless a legitimate API/data agreement exists.**

The architecture should allow provider adapters.

------------------------------------------------------------------------

# 22. Charger provider abstraction

Create an interface similar to:

``` ts
interface ChargerProvider {
  providerId: string

  searchStations(params: StationSearchParams): Promise<Station[]>

  getStation(stationId: string): Promise<Station | null>

  getAvailability(stationId: string): Promise<Availability>

  getTariff(stationId: string): Promise<Tariff | null>

  startSession?(params: StartSessionParams): Promise<Session>

  stopSession?(sessionId: string): Promise<Session>

  reserve?(params: ReservationParams): Promise<Reservation>
}
```

Adapters:

``` text
OpenChargeMapProvider
NrelProvider
ChargeLocalProvider
FutureOcpiProvider
```

This prevents the public charger system from becoming vendor-specific
spaghetti.

------------------------------------------------------------------------

# 23. Mapping stack

Recommended MVP:

**Mapbox**

Use: - Mapbox GL JS / Mapbox Maps - Search / Geocoding -
route/navigation APIs where appropriate

Mapbox provides map rendering, geocoding/search, navigation APIs, and an
EV Charge Finder API is currently listed in its platform documentation.

Sources: https://docs.mapbox.com/

https://docs.mapbox.com/playground/geocoding/

Alternative: Google Maps Platform.

If Google Maps is used, follow Google's map display, attribution,
caching, and API terms carefully.

------------------------------------------------------------------------

# 24. Architecture

Recommended stack:

## Frontend

-   React
-   TypeScript
-   Vite
-   React Router
-   Tailwind CSS only as a utility layer, not as a design system
-   Mapbox GL JS
-   Lucide or another restrained icon library
-   TanStack Query
-   Zod
-   React Hook Form

## Backend

Recommended: - Supabase - PostgreSQL - Supabase Auth - Supabase
Storage - Supabase Realtime - Edge Functions where appropriate

Alternative: - Node.js / Fastify - PostgreSQL - Redis - object storage

Do not over-engineer the MVP.

------------------------------------------------------------------------

# 25. Database model

Core tables:

## profiles

``` text
id
display_name
avatar_url
bio
role
created_at
updated_at
```

Role should support: - driver - host - both - admin

------------------------------------------------------------------------

## vehicles

``` text
id
user_id
make
model
year
connector_types[]
battery_capacity_kwh
nickname
created_at
```

------------------------------------------------------------------------

## chargers

``` text
id
host_id

name
description

latitude
longitude

public_latitude
public_longitude

connector_type
level
max_kw
voltage
amperage

charger_brand
charger_model

pricing_type
price_per_kwh
price_per_session
price_per_hour

approval_mode

parking_type
parking_instructions
access_instructions_private

photos[]

status

created_at
updated_at
```

Important: `latitude/longitude` are private.
`public_latitude/public_longitude` are intentionally fuzzed/approximate.

------------------------------------------------------------------------

## charger_availability

``` text
id
charger_id
day_of_week
start_time
end_time
enabled
```

------------------------------------------------------------------------

## availability_exceptions

``` text
id
charger_id
start_at
end_at
reason
```

------------------------------------------------------------------------

## bookings

``` text
id
charger_id
driver_id
vehicle_id

requested_start
requested_end

approved_start
approved_end

status

requested_kwh
estimated_cost
final_cost

driver_message
host_response

created_at
updated_at
```

------------------------------------------------------------------------

## charging_sessions

``` text
id
booking_id

started_at
ended_at

start_soc
end_soc

energy_kwh
peak_kw
average_kw

status

telemetry_source
```

------------------------------------------------------------------------

## payments

``` text
id
booking_id
driver_id
host_id

provider
provider_payment_id

amount
platform_fee
host_amount

currency
status

created_at
```

------------------------------------------------------------------------

## reviews

``` text
id
booking_id
reviewer_id
reviewee_id

rating
comment

created_at
```

------------------------------------------------------------------------

## charger_reports

``` text
id
charger_id
reporter_id

reason
description
status

created_at
resolved_at
```

------------------------------------------------------------------------

## public_stations

``` text
id
provider
provider_station_id

name

latitude
longitude

address

connector_types[]
max_kw

status
availability

pricing_summary

raw_provider_data

last_synced_at
```

Do not store provider data indiscriminately.

Keep a normalized representation plus provider-specific raw data only
when permitted.

------------------------------------------------------------------------

## activity_events

``` text
id
actor_id
entity_type
entity_id
event_type
metadata
created_at
```

This is important for debugging and trust.

------------------------------------------------------------------------

# 26. Security / privacy

Residential chargers are inherently sensitive.

Implement:

### Row-level security

Users can: - read public listing information - modify only their own
chargers - see only their own bookings - see exact address only after
approval

### Coordinate fuzzing

Public map location should be offset by a small radius.

Do not simply render the true home coordinate.

### Exact address

Store separately from public map coordinates if possible.

### Private instructions

Examples: - gate code - garage code - Wi-Fi - personal phone number

These must never be public.

### Contact

Do not expose personal phone/email by default.

Use in-app communication.

------------------------------------------------------------------------

# 27. Trust system

Create a reputation system.

Host reputation: - successful sessions - average rating - response
time - cancellation rate

Driver reputation: - successful sessions - no-show rate - cancellation
rate - ratings from hosts

Do not show meaningless "verified" badges everywhere.

Verification should mean something.

Potential verification levels:

### Basic

Email + phone

### Identity verified

Government ID / identity provider

### Charger verified

Host provides charger proof / photo / hardware verification

### Trusted host

Enough completed sessions + strong reliability

Use these sparingly.

------------------------------------------------------------------------

# 28. Safety features

Required:

-   Report listing
-   Report driver
-   Block user
-   Cancel booking
-   Emergency contact flow
-   Never expose house interior
-   Exact location only after approval
-   Host can immediately disable listing
-   Driver can cancel if location/instructions don't match

Potential future:

-   optional dashcam/photo check-in
-   license plate sharing
-   verified vehicle
-   host "I am home / I am not home" mode
-   smart lock integration
-   garage access automation

------------------------------------------------------------------------

# 29. Smart availability

A listing should not simply be "available."

Availability can come from:

### Manual

Host controls schedule.

### Calendar

Host imports calendar.

### Charger telemetry

If connected to a supported smart charger.

### Session state

ChargeLocal automatically marks the charger unavailable during a
booking.

Future: - OCPP - manufacturer APIs - smart-home integrations

------------------------------------------------------------------------

# 30. Smart charger integrations

Architect an integration layer:

``` text
ChargerIntegration
├── manual
├── OCPP
├── Tesla-compatible provider
├── ChargePoint-compatible provider
├── Wallbox
├── Emporia
└── future adapters
```

OCPP is the relevant open protocol for charger-to-management-system
communication.

Do not implement OCPP merely for the MVP unless hardware integration is
explicitly required.

------------------------------------------------------------------------

# 31. Messaging

Do not build a full social network.

Messaging is contextual.

A booking gets a conversation thread.

Example:

Driver: \> "I'm about 10 minutes away."

Host: \> "Sounds good --- the spot is open."

Messages should automatically include: - booking - charger - scheduled
time - session state

------------------------------------------------------------------------

# 32. Notifications

Push/email/SMS later.

Notification types:

### Driver

-   request approved
-   request declined
-   host suggested another time
-   booking starts soon
-   host sent message
-   charging started
-   charging interrupted
-   session ending
-   payment completed

### Host

-   new request
-   driver arriving
-   session started
-   session ended
-   payment received
-   review received

Avoid notification spam.

------------------------------------------------------------------------

# 33. Activity screen

Timeline rather than dashboard.

Example:

``` text
TODAY

7:02 PM
Charging started
Alex's Home Charger

6:41 PM
Booking approved
Alex's Home Charger

6:15 PM
Request sent
Alex's Home Charger

YESTERDAY

3:12 PM
Session completed
Downtown DC Fast Charging
```

Activity should feel like a travel/charging history.

------------------------------------------------------------------------

# 34. Driver profile

Show: - vehicle - connector - charging history - reviews - saved
chargers - payment methods - preferences

Optional preference:

> "I usually need \~20--30 kWh."

This can improve recommendations.

------------------------------------------------------------------------

# 35. Saved chargers

Allow users to save: - chargers - hosts - destinations

Example:

**Home** **Work** **Richmond** **Charlottesville**

Eventually:

> "Your usual charger is unavailable. Two alternatives are nearby."

------------------------------------------------------------------------

# 36. Intelligence / recommendation engine

Long-term feature:

**ChargeLocal Assist**

Given:

-   destination
-   current SOC
-   vehicle
-   desired arrival SOC
-   current traffic
-   charger availability
-   charging speed
-   price
-   reliability
-   detour

Rank options by:

``` text
score =
  availability
+ route convenience
+ reliability
+ price
+ charging speed
+ host confidence
```

Do not initially market this as AI.

It should simply feel smart.

------------------------------------------------------------------------

# 37. Interesting future features

These are deliberately beyond MVP.

## 37.1 "Charge on the way"

Driver enters destination.

ChargeLocal finds residential chargers along the route.

## 37.2 "Quiet charging"

Filter for chargers where: - no host interaction - outdoor charger - no
gate - no need to meet owner

## 37.3 "Friendly charging"

Some hosts can opt into a social mode:

> "Coffee available" "Dog-friendly" "Local recommendations"

Keep optional.

## 37.4 Solar charging

Host can optionally indicate: - solar - battery storage -
renewable-energy preference

Do not make unsupported claims about energy source.

## 37.5 Smart pricing

Host could say:

> "Free after 10 PM."

## 37.6 Charging circles

Neighborhood groups can create private charger networks.

Example:

> "Oak Grove EV Circle"

Invite-only chargers.

## 37.7 Apartment mode

Apartment residents can list shared chargers.

## 37.8 Workplace mode

Employers can create private charging networks.

## 37.9 Fleet mode

Small businesses can manage multiple residential or workplace chargers.

## 37.10 Charger hardware marketplace

Eventually:

> "Your charger is compatible with ChargeLocal."

Then recommend hardware.

Do not build this into MVP.

------------------------------------------------------------------------

# 38. Map ranking

When multiple chargers are nearby, rank based on:

1.  availability
2.  connector compatibility
3.  distance
4.  route detour
5.  charging speed
6.  price
7.  reliability
8.  rating

Avoid ranking purely by distance.

------------------------------------------------------------------------

# 39. Empty states

Never show blank white pages.

Example:

### No chargers nearby

> No chargers here yet.
>
> Try expanding the search or add your own charger.

CTA: **Host a charger**

### No residential chargers

> Public charging is available nearby.
>
> There aren't any local home chargers listed yet.

### No availability

> Nothing is open at that time.
>
> Try another time or view public fast chargers.

------------------------------------------------------------------------

# 40. Loading states

Map: - skeleton controls - subtle marker loading - do not flash fake
markers

Charger detail: - preserve panel structure - shimmer only where useful

Never show a generic full-page spinner.

------------------------------------------------------------------------

# 41. Error states

Example:

> We couldn't update charger availability.

Buttons: - Retry - Show last known state

If data is stale:

> Availability updated 18 min ago.

Trust beats polish.

------------------------------------------------------------------------

# 42. Responsive behavior

### Mobile

Map-first.

Bottom sheet.

Thumb-friendly controls.

No tiny map markers.

### Tablet

Map + detail panel.

### Desktop

Map + persistent detail drawer.

### Very wide screens

Do not stretch content indefinitely.

Map can expand.

UI content should maintain readable width.

------------------------------------------------------------------------

# 43. Motion

Motion should communicate state.

Use: - marker selection transition - sheet spring - booking confirmation
transition - charging progress - route drawing

Avoid: - bouncing cards - floating decorations - constant pulsing -
parallax for no reason

Suggested motion: - 150--250ms for small transitions - 300--450ms for
sheets - spring-like easing for map/detail transitions

Respect `prefers-reduced-motion`.

------------------------------------------------------------------------

# 44. Accessibility

Required:

-   keyboard navigation
-   visible focus states
-   semantic buttons
-   screen-reader labels
-   sufficient contrast
-   map controls accessible without pointer
-   bottom sheets accessible
-   dialogs trap focus
-   reduced motion
-   text alternatives for charger status

Never encode availability only through color.

Use: - icon - text - color

------------------------------------------------------------------------

# 45. MVP scope

Build the first version around these flows only:

## Driver

-   sign up / sign in
-   map
-   public charger data
-   residential charger data
-   search
-   filters
-   charger detail
-   request charge
-   booking status
-   activity
-   profile

## Host

-   become host
-   create charger
-   edit charger
-   availability schedule
-   pricing
-   request approval
-   booking management
-   activity
-   listing pause

## Admin

-   users
-   chargers
-   reports
-   public station sync
-   moderation

------------------------------------------------------------------------

# 46. MVP should NOT include

Do not prematurely build:

-   full navigation engine
-   OCPP
-   smart charging
-   dynamic pricing
-   AI assistant
-   fleet management
-   charger hardware marketplace
-   social feed
-   complex messaging
-   loyalty program
-   crypto
-   gamification
-   elaborate analytics

Make the core loop excellent first.

------------------------------------------------------------------------

# 47. Recommended project structure

``` text
src/
  app/
    router/
    providers/
    layout/

  components/
    ui/
    map/
    charger/
    booking/
    host/
    activity/
    profile/

  features/
    map/
    chargers/
    bookings/
    hosting/
    payments/
    messaging/
    activity/

  lib/
    api/
    auth/
    maps/
    providers/
    validation/

  hooks/

  types/

  pages/
    MapPage
    ActivityPage
    HostPage
    ProfilePage

supabase/
  migrations/
  functions/
  seed/
```

Avoid one giant `App.tsx`.

------------------------------------------------------------------------

# 48. Design-system components

Build reusable primitives:

``` text
Button
IconButton
TextField
SearchField
SegmentedControl
FilterButton
Sheet
Drawer
Dialog
Toast
Avatar
ChargerMarker
StatusIndicator
PriceDisplay
ChargerSpec
BookingRow
ActivityRow
Rating
MapControl
EmptyState
```

Do not create 50 tiny components that add no semantic value.

------------------------------------------------------------------------

# 49. Map component architecture

Recommended:

``` text
MapShell
 ├── MapCanvas
 ├── MapSearch
 ├── MapFilters
 ├── MapControls
 ├── ChargerMarkers
 ├── RouteLayer
 └── ChargerDetailSheet
```

The map should own map-specific state.

Application state should own: - selected charger - booking - user -
filters

Do not make the entire application re-render on every map interaction.

------------------------------------------------------------------------

# 50. Data fetching

Use TanStack Query or equivalent.

Patterns:

``` text
useNearbyChargers()
useCharger()
usePublicStations()
useAvailability()
useBooking()
useHostBookings()
useActivity()
```

Use: - caching - stale times - optimistic updates only where safe -
invalidation after booking state changes

Availability should have a short stale time.

------------------------------------------------------------------------

# 51. Realtime

Use realtime only where it matters:

-   booking approval
-   active charging session
-   host request queue
-   messages

Do not make every table realtime.

------------------------------------------------------------------------

# 52. Seed/demo data

Create realistic demo data around: - Charlottesville, VA - Richmond,
VA - Washington, DC

Include: - 15--30 residential chargers - 30--60 public chargers - varied
connector types - varied speeds - varied pricing - unavailable
chargers - pending bookings - active charging session

Make demo data internally consistent.

Do not label fictional stations as real companies.

Public station data should come from a legitimate provider or clearly
marked demo fixtures.

------------------------------------------------------------------------

# 53. Demo scenarios

The app should support a polished demo account.

### Driver demo

Driver: - Tesla Model 3 - 24% SOC - destination Richmond

Map displays: - public DC fast chargers - residential Level 2 chargers

User selects:

> Alex's Home Charger

Requests: 6:30--8:30 PM

Then switch to host mode.

### Host demo

Alex sees: \> New charging request

Approves.

Driver view updates to: \> Approved

Then simulate: - arriving - charging - completed

This should make the prototype feel alive.

------------------------------------------------------------------------

# 54. Public charger normalization

Normalize provider data into:

``` ts
type Station = {
  id: string
  source: string
  sourceId: string

  name: string
  latitude: number
  longitude: number

  address?: string

  operator?: string

  connectors: Connector[]
  maxPowerKw?: number

  access: AccessType

  availability: AvailabilityState

  pricing?: PricingSummary

  lastUpdatedAt?: string
}
```

Connector:

``` ts
type Connector = {
  type: ConnectorType
  powerKw?: number
  quantity?: number
  status?: AvailabilityState
}
```

------------------------------------------------------------------------

# 55. Residential charger normalized model

``` ts
type ResidentialCharger = {
  id: string
  hostId: string

  publicLocation: {
    lat: number
    lng: number
  }

  privateLocation: {
    address: string
    lat: number
    lng: number
  }

  connector: ConnectorType
  level: ChargingLevel
  maxPowerKw: number

  pricing: Pricing

  approvalMode: "manual" | "automatic"

  availability: AvailabilityState

  parkingType: ParkingType

  listingStatus: "active" | "paused" | "pending_review"

  rating?: number
  completedSessions: number
}
```

------------------------------------------------------------------------

# 56. Backend API boundaries

Example:

``` text
GET    /chargers/nearby
GET    /chargers/:id
POST   /chargers
PATCH  /chargers/:id
DELETE /chargers/:id

GET    /chargers/:id/availability
PUT    /chargers/:id/availability

POST   /bookings
GET    /bookings/:id
POST   /bookings/:id/approve
POST   /bookings/:id/decline
POST   /bookings/:id/cancel

POST   /sessions/:id/start
POST   /sessions/:id/end

GET    /activity

GET    /public-stations
```

If using Supabase directly, these boundaries can map to RPCs/Edge
Functions rather than a traditional REST API.

------------------------------------------------------------------------

# 57. Authorization matrix

  Action                                            Driver    Host   Admin
  --------------------------------------- ---------------- ------- -------
  View public chargers                                   ✓       ✓       ✓
  View residential approximate location                  ✓       ✓       ✓
  View exact address before approval                     ✗   ✓ own       ✓
  Create charger                                         ✓       ✓       ✓
  Edit own charger                                       ✗       ✓       ✓
  Request booking                                        ✓       ✓       ✓
  Approve own booking                                    ✗       ✓       ✓
  View private booking instructions         after approval       ✓       ✓
  Pause own charger                                      ✗       ✓       ✓
  Moderate charger                                       ✗       ✗       ✓

------------------------------------------------------------------------

# 58. Moderation

Residential charging is a marketplace.

Admin tooling needs:

-   reported listings
-   reported users
-   suspicious behavior
-   excessive cancellations
-   fake charger reports
-   duplicate listings
-   prohibited content
-   payout disputes

Do not build a huge admin dashboard.

Build a queue.

------------------------------------------------------------------------

# 59. Anti-abuse

Eventually:

-   rate limits
-   request limits
-   identity verification
-   payment verification
-   device fingerprinting
-   fraud detection
-   booking deposits
-   no-show penalties

For MVP: - basic rate limiting - authenticated booking - email
verification - report/block

------------------------------------------------------------------------

# 60. Legal/product considerations

The app deals with: - private residences - payments - physical access -
electricity - potentially liability

Do not make legal claims.

Before production launch, obtain professional review for: - marketplace
terms - host liability - driver liability - payment terms - cancellation
policy - electrical safety - local zoning/HOA restrictions - insurance -
tax reporting - privacy - location data

The app should include: - Terms - Privacy - Safety - Report issue

------------------------------------------------------------------------

# 61. Monetization

Possible model:

### Marketplace fee

Driver pays: - charger cost - small platform fee

Host receives: - charger cost minus platform fee

Example:

``` text
Energy
$6.84

ChargeLocal fee
$0.82

Total
$7.66

Host receives
$6.02
```

Do not hard-code these rates.

Make fees configurable.

Alternative: - host subscription - free charging network with premium
features - hardware referral revenue

Marketplace fee is simplest.

------------------------------------------------------------------------

# 62. Metrics

Track:

### Supply

-   active residential chargers
-   new listings
-   charger activation rate

### Demand

-   searches
-   charger views
-   booking requests
-   booking conversion

### Reliability

-   approval rate
-   cancellation rate
-   no-show rate
-   completed session rate

### Marketplace liquidity

-   chargers per active driver
-   requests per charger
-   median time to approval

### Revenue

-   GMV
-   platform revenue
-   host earnings

Do not put all of these in the product UI.

These are internal metrics.

------------------------------------------------------------------------

# 63. North-star metric

**Completed charging sessions**

Supporting metrics:

-   request → completed session conversion
-   median approval time
-   repeat driver rate
-   repeat host rate

The product is not successful because it has many pins.

It is successful because people actually charge.

------------------------------------------------------------------------

# 64. Analytics events

Implement:

``` text
map_opened
location_shared
charger_viewed
filter_used
search_performed

booking_started
booking_requested
booking_approved
booking_declined
booking_cancelled
booking_completed

session_started
session_completed

host_onboarding_started
host_onboarding_completed

charger_created
charger_paused

review_submitted
report_submitted
```

Include useful metadata, but do not log sensitive private addresses.

------------------------------------------------------------------------

# 65. Performance

The map can contain thousands of stations.

Requirements: - cluster markers - viewport-based fetching - server-side
geospatial queries - debounce map movement - cache public station data -
avoid rendering every marker as a React component if unnecessary - use
GeoJSON/source layers when appropriate

Postgres + PostGIS is strongly recommended.

------------------------------------------------------------------------

# 66. Geospatial database

Enable PostGIS.

Use geography/geometry types.

Example conceptual query:

``` sql
SELECT *
FROM chargers
WHERE ST_DWithin(
  location,
  ST_MakePoint(:lng, :lat)::geography,
  :radius_meters
);
```

Index geospatial columns.

Do not calculate distance in JavaScript for every charger.

------------------------------------------------------------------------

# 67. Map privacy implementation

For each residential charger:

``` text
private point
      ↓
privacy transform
      ↓
public map point
```

The public point can be deterministic so it doesn't jump every request.

The exact address is returned only after authorization.

------------------------------------------------------------------------

# 68. Search experience

Search should feel like navigation, not database search.

Top field:

> Where are you going?

Secondary:

> Search chargers, neighborhoods, or addresses

When destination is entered:

``` text
Charging along your route

Best match
Alex's Home Charger
4 min detour · 11.5 kW · $0.18/kWh

Fastest
DC Fast Charger
9 min detour · 250 kW · $0.49/kWh
```

This is a future differentiator.

------------------------------------------------------------------------

# 69. Charger comparison

If the user taps multiple chargers:

Allow a simple comparison:

``` text
             Alex       FastCharge
Distance     0.7 mi     2.1 mi
Power        11.5 kW    250 kW
Price        $0.18      $0.49
Availability Request    Available
Detour       4 min      9 min
```

Do not make this a spreadsheet.

------------------------------------------------------------------------

# 70. Host listing preview

Hosts need to know what drivers see.

Preview:

``` text
Alex's Home Charger

11.5 kW
Level 2
J1772

$0.18/kWh

~0.7 mi away

Approval required

[Parking photo]

Driveway parking
Outdoor charger
No indoor access

Alex
4.9 ★
18 sessions
```

------------------------------------------------------------------------

# 71. Microcopy principles

Use natural language.

Good:

> "Can you charge here?"

> "Waiting for Alex"

> "You're approved."

> "Charger is ready."

> "Thanks for charging locally."

Avoid:

> "Initiate reservation workflow"

> "Charging asset available"

> "Transaction successfully instantiated"

------------------------------------------------------------------------

# 72. Homeowner psychology

The host experience should answer:

-   Is this safe?
-   Who is coming?
-   When are they coming?
-   How much will I make?
-   What do I have to do?
-   Can I cancel?
-   What if something goes wrong?

Design around those questions.

------------------------------------------------------------------------

# 73. Driver psychology

The driver experience should answer:

-   Can I charge?
-   Is it compatible?
-   Is it actually available?
-   How fast?
-   How much?
-   Where exactly do I go?
-   Do I need permission?
-   What happens when I arrive?

If a screen doesn't answer one of these, simplify it.

------------------------------------------------------------------------

# 74. MVP visual screens

Build these polished screens:

1.  Map / discovery
2.  Map + charger selected
3.  Residential charger detail
4.  Public charger detail
5.  Request charging
6.  Request pending
7.  Host approval
8.  Booking approved
9.  Active charging
10. Session complete
11. Activity
12. Host home
13. Host onboarding
14. Host charger settings
15. Host availability
16. Profile
17. Filter sheet
18. Search/destination mode
19. Report charger
20. Empty/error states

Each should feel like the same product.

------------------------------------------------------------------------

# 75. Design acceptance criteria

Before considering UI complete, check:

### Visual

-   no generic SaaS cards
-   no accidental gradients
-   no excessive rounded containers
-   no fake dashboard metrics
-   no inconsistent spacing
-   no random icon styles
-   no giant empty areas
-   no tiny unreadable controls
-   no visually noisy map

### Interaction

-   selected charger is obvious
-   booking state is obvious
-   approval state is obvious
-   user always knows what happens next
-   back navigation works
-   sheets behave naturally
-   map and detail panel stay synchronized

### Trust

-   exact residential location hidden until approval
-   availability clearly timestamped
-   public vs residential clearly differentiated
-   no fake real-time status
-   no fake payment completion

### Accessibility

-   keyboard navigation
-   focus states
-   contrast
-   reduced motion
-   semantic controls

------------------------------------------------------------------------

# 76. Build order

## Phase 1 --- Foundation

-   React/Vite
-   TypeScript
-   routing
-   design tokens
-   app shell
-   responsive layout
-   Supabase
-   authentication

## Phase 2 --- Map

-   Mapbox
-   location
-   geospatial queries
-   residential markers
-   public station markers
-   clustering
-   search

## Phase 3 --- Residential marketplace

-   charger creation
-   listing
-   availability
-   detail page
-   booking requests
-   approval flow

## Phase 4 --- Sessions

-   session state machine
-   active charging UI
-   completion
-   activity

## Phase 5 --- Public charging

-   Open Charge Map/NREL provider adapter
-   normalization
-   caching
-   provider attribution
-   refresh jobs

## Phase 6 --- Trust

-   reviews
-   reports
-   profiles
-   verification
-   privacy hardening

## Phase 7 --- Payments

-   Stripe Connect test mode
-   payout model
-   platform fee
-   payment state machine

## Phase 8 --- Polish

-   responsive refinement
-   animation
-   loading/error states
-   accessibility
-   performance
-   testing

------------------------------------------------------------------------

# 77. Testing

Unit: - booking state transitions - availability calculations -
pricing - privacy coordinate transformation - authorization

Integration: - create charger - request booking - approve booking -
start session - complete session

E2E: - driver discovers charger - driver requests - host approves -
driver sees exact location - driver completes session

Security: - driver cannot read private host address - driver cannot
modify another user's charger - host cannot approve another host's
booking - unauthenticated users cannot create listings - private
instructions never appear in public API responses

------------------------------------------------------------------------

# 78. Seed data philosophy

Seed data should tell a story.

Examples:

**Residential** - Alex --- Level 2 J1772 --- \$0.18/kWh - Maya ---
Tesla/NACS --- free - Jordan --- 7.2 kW --- \$5/session - Chris --- 11.5
kW --- appointment required

**Public** - DC Fast --- 250 kW - DC Fast --- 150 kW - Level 2 --- 11 kW

Use realistic variation.

------------------------------------------------------------------------

# 79. Important API/data-source constraints

Do not scrape websites that prohibit scraping.

Prefer: - official APIs - open datasets - licensed feeds - Open Charge
Map - NREL/AFDC - OCPI-compatible providers

Keep provider-specific adapters isolated.

Never expose provider API keys in the browser.

------------------------------------------------------------------------

# 80. Current integration research notes

Open Charge Map currently exposes a v3.1 API for charging-location POIs
and reference data. It requires an API key and has explicit fair-use
guidance; for high-volume usage, the service recommends a mirror/import
strategy. Treat its data licensing and attribution fields carefully.

Mapbox currently documents: - Geocoding - Search - Navigation - EV
Charge Finder API - mobile SDKs

Google Routes API is another viable routing option. Google imposes map
display, attribution, caching, and policy requirements, so do not
casually mix Google route/map data into a Mapbox-rendered map without
checking the applicable terms.

OCPI is the long-term interoperability layer to keep in mind. Current
OCPI documentation describes location, tariff, session, authorization,
reservation, billing/CDR, real-time status, remote commands, and
smart-charging functionality.

Sources: - Open Charge Map API:
https://www.openchargemap.org/develop/api - Mapbox docs:
https://docs.mapbox.com/ - Google Routes API:
https://developers.google.com/maps/documentation/routes - OCPI:
https://ocpi-protocol.com/

------------------------------------------------------------------------

# 81. What the coding agent should produce

The first implementation should be a **working, visually polished
vertical slice**, not 80 unfinished screens.

Minimum complete loop:

``` text
Driver
  ↓
Open map
  ↓
Find residential charger
  ↓
View charger
  ↓
Request time
  ↓
Host receives request
  ↓
Host approves
  ↓
Driver sees booking
  ↓
Driver checks in
  ↓
Charging state
  ↓
Session complete
  ↓
Review
```

At the same time:

``` text
Map
  ├── Residential chargers
  ├── Public chargers
  ├── Search
  ├── Filters
  └── Availability
```

Make this loop excellent before expanding horizontally.

------------------------------------------------------------------------

# 82. Final product feeling

When someone opens ChargeLocal, it should feel like:

> "Oh. This is a real charging network."

Not:

> "This is a startup demo."

The map should feel calm.

The information should feel trustworthy.

The residential listings should feel human but not social-media-like.

The booking flow should feel effortless.

The homeowner should feel in control.

The driver should feel confident.

The public charging network should feel seamlessly integrated.

And the entire interface should have enough restraint that someone could
plausibly believe it shipped from a serious mobility company.

**Build less. Design it better. Make the charging session loop feel
real.**
