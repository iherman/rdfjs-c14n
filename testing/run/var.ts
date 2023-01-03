import * as yaml from 'yaml';

interface LogItem {
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

class Logger {
    private theLog: LogItem[] = [];

    logItem(position: string, ...args: LogItem[]): void {
        const retval: LogItem = {
                position
        };
        if (args.length > 0) {
            retval["info"] = args;
        }
    
        this.theLog.push(retval);
    };

    get log(): string {
        return yaml.stringify(this.theLog);
    }
}



const logger: Logger = new Logger();



logger.logItem("this is a logging position", {"hash":"abcdef"}, {"some other thing": ["something", "in the","air"]});
logger.logItem("another logging position")
logger.logItem("final logging position", {"something else": true});

console.log(logger.log);
