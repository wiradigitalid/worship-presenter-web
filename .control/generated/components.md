# components

> Tergenerate oleh `.constitution/scripts/validate --generate`. MUST NOT diedit tangan.

```yaml
product_components:
- id: hub
  name: Hub
  containers:
  - web
  logical_components:
  - LC-1
  - LC-12
  - LC-13
  - LC-16
  - LC-2
  - LC-3
  - LC-4
  - LC-5
  - LC-6
  - LC-7
  - LC-8
- id: presenter
  name: Presenter
  containers:
  - web
  logical_components:
  - LC-10
  - LC-14
  - LC-9
- id: registry
  name: Registry
  containers:
  - web
  logical_components:
  - LC-11
  - LC-15
logical_components:
- id: LC-1
  type: gateway
  component: hub
  area: auth
  owner: null
- id: LC-10
  type: gateway
  component: presenter
  area: present-channel
  owner: null
- id: LC-11
  type: gateway
  component: registry
  area: artifacts
  owner: null
- id: LC-12
  type: service
  component: hub
  area: services
  owner: null
- id: LC-13
  type: job
  component: hub
  area: pptx
  owner: null
- id: LC-14
  type: service
  component: presenter
  area: present-channel
  owner: null
- id: LC-15
  type: service
  component: registry
  area: artifacts
  owner: null
- id: LC-16
  type: service
  component: hub
  area: slide-plan
  owner: null
- id: LC-2
  type: gateway
  component: hub
  area: services
  owner: null
- id: LC-3
  type: gateway
  component: hub
  area: announcements
  owner: null
- id: LC-4
  type: gateway
  component: hub
  area: uploads
  owner: null
- id: LC-5
  type: gateway
  component: hub
  area: accounts
  owner: null
- id: LC-6
  type: gateway
  component: hub
  area: settings
  owner: null
- id: LC-7
  type: gateway
  component: hub
  area: hymns
  owner: null
- id: LC-8
  type: gateway
  component: hub
  area: webhook
  owner: null
- id: LC-9
  type: gateway
  component: presenter
  area: scripture
  owner: null
```
