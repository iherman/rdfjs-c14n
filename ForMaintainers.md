# RDF Canonicalization in TypeScript — Additional features

The implementation has some additional features that are of no real interest for average users, but may be of interest for developers, code maintainers, etc.


## Logging

The canonicalization algorithm has built-in logging points that can be followed via a logger. This is only of interest for debugging the algorithm itself. By default, no logging happens.

A built-in logger can be switched on which displays logging information in YAML. To use this YAML logger, do the following:

```js
import { LogLevels } from 'rdfjs-c14n';
…
main() {
    …
    const rdfc10 = new RDFC10();
    // `logLevel` may be LogLevels.error, LogLevels.warn, LogLevels.info, LogLevels.debug  
    const logger = rdfc10.setLogger("YamlLogger", logLevel);
    …
    // "logger.log" is a string containing the full log in YAML format
    console.log(logger.log);
}
```

Implementers may add their own loggers by implementing a new Logger instance. See the [interface specification for Logger](https://iherman.github.io/rdfjs-c14n/interfaces/lib_logging.Logger.html) to possibly implement your own logger, and the general documentation on how to add this logger to the list of available loggers. In case there are more loggers, the list of available logger types is also available to the end user via:

```js
    rdfc10.available_logger_types;
```

that returns the loggers that are included in the distribution.

## Configurations

The default complexity value and the hash algorithm are both set in the code, see the [configuration module](https://iherman.github.io/rdfjs-c14n/modules/lib_config.html). This may be modified if the library is installed somewhere.

Specific applications/installations may want to add the possibility to let the user configure these values, e.g., via environment variables or configuration files. This requires specific features (e.g., file access) depending on the platform used to run the algorithm (e.g., node.js, deno, or a browser platform), i.e., this requires some extra code that should not be included in the library. However, the library _is_ prepared to run such an external configuration setting via a callback when constructing the RDFC10 instance, as follows:

```js
    …
    const rdfc10 = new RDFC10(null, getConfigData);
    …
```

where `null` stands for a possible `DataFactory` instance (or `null` if the default is used) and `getConfigData` stands for a callback returning the configuration data. An example [callback](https://github.com/iherman/rdfjs-c14n/blob/main/extras/nodeConfiguration.ts) (using a combination of environment variables and configuration files and relying on the `node.js` platform) is available, and can be easily adapted to other platforms (e.g., `deno`). (A [javascript version](https://github.com/iherman/rdfjs-c14n/blob/main/extras/nodeConfiguration.js) of the callback is also available.)

---

Maintainer: [@iherman](https://github.com/iherman)
