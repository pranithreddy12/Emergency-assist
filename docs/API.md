# EmergencyAI — API Reference

Base URL: `http://localhost:3000/api/v1` · Interactive docs (Swagger): `/docs`

Auth: send `Authorization: Bearer <accessToken>` unless marked **public**.
Roles: 🔒 = any authenticated user · 👮 = HOSPITAL_STAFF/ADMIN · 🛡️ = ADMIN.

## Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | public — email + password |
| POST | `/auth/login` | public |
| POST | `/auth/guest` | public — Emergency Guest Mode |
| POST | `/auth/refresh` | public — rotate refresh token |
| POST | `/auth/logout` | 🔒 revoke refresh session |

## Users
| GET | `/users/me` | 🔒 current user |

## Medical profile
| GET | `/medical-profile` | 🔒 |
| PUT | `/medical-profile` | 🔒 update profile (insurance stored encrypted) |
| PUT | `/medical-profile/contacts` | 🔒 replace emergency contacts |
| GET | `/medical-card/:qrToken` | public — read-only emergency card |

## Triage
| POST | `/triage/assess` | 🔒 severity + confidence + first-aid steps (never diagnoses) |

## Emergency / SOS
| POST | `/incidents` | 🔒 raise SOS (runs triage, persists report) |
| GET | `/incidents` | 🔒 my incidents |
| GET | `/incidents/:id` | 🔒 one incident + report + timeline |
| PATCH | `/incidents/:id/status` | 🔒 advance the state machine |
| WS | `/emergency` | `incident:join` / `incident:leave`; server pushes `incident:*` events |

## Contacts & tracking
| POST | `/incidents/:id/alert-contacts` | 🔒 SMS/WhatsApp/call + live link |
| GET | `/track/:token` | public — live incident status |

## Hospital pre-arrival
| POST | `/incidents/:id/prearrival` | 🔒 send hand-off snapshot |
| GET | `/prearrivals/:id` | 🔒 |
| GET | `/hospitals/:hospitalId/prearrivals` | 👮 hospital inbox |
| POST | `/prearrivals/:id/acknowledge` | 👮 accept/decline |

## Guidance (public first-aid content)
| GET | `/guidance` | list topics (`?category=`) |
| GET | `/guidance/bundle` | full offline bundle + checksum |
| GET | `/guidance/:slug` | one topic with steps |

## Hospitals
| GET | `/hospitals/search` | 🔒 `?latitude&longitude&capability&radiusKm&openNow&sort&limit` |
| GET | `/hospitals/:id` | 🔒 |

## Ambulance
| POST | `/ambulance/book` | 🔒 one-tap nearest unit |
| GET | `/ambulance/requests` | 🔒 my requests |
| GET | `/ambulance/requests/:id/track` | 🔒 live ETA + driver |
| DELETE | `/ambulance/requests/:id` | 🔒 cancel |

## Voice
| POST | `/voice/transcribe` | 🔒 speech-to-text |
| POST | `/voice/speak` | 🔒 text-to-speech |
| POST | `/voice/assist` | 🔒 voice → triage → spoken guidance |

## Timeline
| GET | `/timeline` | 🔒 unified medical timeline |
| GET | `/timeline/summary` | 🔒 counts |

## Analytics 🛡️
| GET | `/analytics/overview` | stats by severity/status |
| GET | `/analytics/response-times` | dispatch latency + ETA stats |
| GET | `/analytics/heatmap` | incident location buckets |
| GET | `/analytics/trends` | incidents per day (`?days=`) |

## Admin 🛡️
| GET·POST·PATCH·DELETE | `/admin/hospitals[/:id]` | hospital CRUD |
| GET·POST·PATCH·DELETE | `/admin/ambulances[/:id]` | ambulance CRUD |
| GET | `/admin/users` · PATCH `/admin/users/:id/role` | user management |
| GET | `/admin/incidents` | all incidents (`?status=`) |
| GET | `/admin/audit-logs` | audit trail (`?limit=`) |

## Health
| GET | `/health` | public — liveness + DB probe |
