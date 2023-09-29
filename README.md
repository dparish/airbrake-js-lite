<p align="center">
  <img src="https://airbrake-github-assets.s3.amazonaws.com/brand/airbrake-full-logo.png" width="200">
</p>

# Official Airbrake Notifier for Browsers

[![Build Status](https://github.com/airbrake/airbrake-js/workflows/CI/badge.svg?branch=master)](https://github.com/airbrake/airbrake-js/actions?query=branch%3Amaster)
[![npm version](https://img.shields.io/npm/v/@airbrake/browser.svg)](https://www.npmjs.com/package/@airbrake/browser)
[![npm dm](https://img.shields.io/npm/dm/@airbrake/browser.svg)](https://www.npmjs.com/package/@airbrake/browser)
[![npm dt](https://img.shields.io/npm/dt/@airbrake/browser.svg)](https://www.npmjs.com/package/@airbrake/browser)

The official Airbrake notifier for capturing JavaScript errors in web browsers
and reporting them to [Airbrake](http://airbrake.io). If you're looking for
Node.js support, there is a
[separate package](https://github.com/airbrake/airbrake-js/tree/master/packages/node).

## Installation

Using yarn:

```sh
yarn add @airbrake/browser
```

Using npm:

```sh
npm install @airbrake/browser
```

Using a `<script>` tag via jsdelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/@airbrake/browser"></script>
```

Using a `<script>` tag via unpkg:

```html
<script src="https://unpkg.com/@airbrake/browser"></script>
```

## Basic Usage

First, initialize the notifier with the project ID and project key taken from
[Airbrake](https://airbrake.io). To find your `project_id` and `project_key`
navigate to your project's _Settings_ and copy the values from the right
sidebar:

![][project-idkey]

```js
import { Notifier } from "@airbrake/browser";

const airbrake = new Notifier({
  projectId: 1,
  projectKey: "REPLACE_ME",
  environment: "production",
});
```

Then, you can send a textual message to Airbrake:

```js
let promise = airbrake.notify(`user id=${user_id} not found`);
promise.then((notice) => {
  if (notice.id) {
    console.log("notice id", notice.id);
  } else {
    console.log("notify failed", notice.error);
  }
});
```

or report errors directly:

```js
try {
  throw new Error("Hello from Airbrake!");
} catch (err) {
  airbrake.notify(err);
}
```

Alternatively, you can wrap any code which may throw errors using the `wrap`
method:

```js
let startApp = () => {
  throw new Error("Hello from Airbrake!");
};
startApp = airbrake.wrap(startApp);

// Any exceptions thrown in startApp will be reported to Airbrake.
startApp();
```

or use the `call` shortcut:

```js
let startApp = () => {
  throw new Error("Hello from Airbrake!");
};

airbrake.call(startApp);
```

## Example configurations

- [AngularJS](examples/angularjs)
- [Angular](examples/angular)
- [Legacy](examples/legacy)
- [Rails](examples/rails)
- [React](examples/react)
- [Redux](examples/redux)
- [Vue.js](examples/vuejs)

## Advanced Usage

### Notice Annotations

It's possible to annotate error notices with all sorts of useful information at
the time they're captured by supplying it in the object being reported.

```js
try {
  startApp();
} catch (err) {
  airbrake.notify({
    error: err,
    context: { component: "bootstrap" },
    environment: { env1: "value" },
    params: { param1: "value" },
    session: { session1: "value" },
  });
}
```

### Severity

[Severity](https://airbrake.io/docs/airbrake-faq/what-is-severity/) allows
categorizing how severe an error is. By default, it's set to `error`. To
redefine severity, simply overwrite `context/severity` of a notice object:

```js
airbrake.notify({
  error: err,
  context: { severity: "warning" },
});
```

### Filtering errors

There may be some errors thrown in your application that you're not interested
in sending to Airbrake, such as errors thrown by 3rd-party libraries, or by
browser extensions run by your users.

The Airbrake notifier makes it simple to ignore this chaff while still
processing legitimate errors. Add filters to the notifier by providing filter
functions to `addFilter`.

`addFilter` accepts the entire
[error notice](https://airbrake.io/docs/api/#create-notice-v3) to be sent to
Airbrake and provides access to the `context`, `environment`, `params`,
and `session` properties. It also includes the single-element `errors` array
with its `backtrace` property and associated backtrace lines.

The return value of the filter function determines whether or not the error
notice will be submitted.

- If `null` is returned, the notice is ignored.
- Otherwise, the returned notice will be submitted.

An error notice must pass all provided filters to be submitted.

In the following example all errors triggered by admins will be ignored:

```js
airbrake.addFilter((notice) => {
  if (notice.params.admin) {
    // Ignore errors from admin sessions.
    return null;
  }
  return notice;
});
```

Filters can be also used to modify notice payload, e.g. to set the environment
and application version:

```js
airbrake.addFilter((notice) => {
  notice.context.environment = "production";
  notice.context.version = "1.2.3";
  return notice;
});
```

### Filtering keys

#### keysBlocklist

With the `keysBlocklist` option, you can specify a list of keys containing
sensitive information that must be filtered out:

```js
const airbrake = new Notifier({
  // ...
  keysBlocklist: [
    "password", // exact match
    /secret/, // regexp match
  ],
});
```

#### keysAllowlist

With the `keysAllowlist` option, you can specify a list of keys that should
_not_ be filtered. All other keys will be substituted with the `[Filtered]`
label.

```js
const airbrake = new Notifier({
  // ...
  keysAllowlist: [
    "email", // exact match
    /name/, // regexp match
  ],
});
```

### Source maps

Airbrake supports using private and public source maps. Check out our docs for
more info:

- [Private source maps](https://airbrake.io/docs/features/private-sourcemaps/)
- [Public source maps](https://airbrake.io/docs/features/public-sourcemaps/)

### Instrumentation

#### console

`@airbrake/browser` automatically instruments `console.log` function calls in
order to collect logs and send them with the first error. You can disable that
behavior using the `instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    console: false,
  },
});
```

#### fetch

Instruments [`fetch`][fetch] calls and sends performance statistics to Airbrake.
You can disable that behavior using the `instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    fetch: false,
  },
});
```

#### onerror

Reports the errors occurring in the Window's [error event][onerror]. You can
disable that behavior using the `instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    onerror: false,
  },
});
```

#### history

Records the history of events that led to the error and sends it to Airbrake.
You can disable that behavior using the `instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    history: false,
  },
});
```

#### xhr

Instruments [XMLHttpRequest][xhr] requests and sends performance statistics to
Airbrake. You can disable that behavior using the `instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    xhr: false,
  },
});
```

#### unhandledrejection

Instruments the [unhandledrejection][unhandledrejection] event and sends
performance statistics to Airbrake. You can disable that behavior using the
`instrumentation` option:

```js
const airbrake = new Notifier({
  // ...
  instrumentation: {
    unhandledrejection: false,
  },
});
```

### APM

#### Routes

```js
import { Notifier } from "@airbrake/browser";

const airbrake = new Notifier({
  projectId: 1,
  projectKey: "REPLACE_ME",
  environment: "production",
});

const routeMetric = this.airbrake.routes.start(
  "GET", // HTTP method name
  "/abc", // Route name
  200, // Status code
  "application/json" // Content-Type header
);
this.airbrake.routes.notify(routeMetric);
```

#### Queries

```js
import { Notifier } from "@airbrake/browser";

const airbrake = new Notifier({
  projectId: 1,
  projectKey: "REPLACE_ME",
  environment: "production",
});

const queryInfo = this.airbrake.queries.start("SELECT * FROM things;");
queryInfo.file = "file.js";
queryInfo.func = "callerFunc";
queryInfo.line = 21;
queryInfo.method = "GET";
queryInfo.route = "/abc";

this.airbrake.queries.notify(queryInfo);
```

#### Queues

```js
import { Notifier } from "@airbrake/browser";

const airbrake = new Notifier({
  projectId: 1,
  projectKey: "REPLACE_ME",
  environment: "production",
});

const queueInfo = this.airbrake.queues.start("FooWorker");
this.airbrake.queues.notify(queueInfo);
```

[project-idkey]: https://s3.amazonaws.com/airbrake-github-assets/airbrake-js/project-id-key.png
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
[onerror]: https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event
[xhr]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
[unhandledrejection]: https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event
