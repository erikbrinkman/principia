class SimpleLogger {
  constructor(readonly level: number, readonly prefix: string) {}

  debug(arg: unknown, ...args: unknown[]): void {
    if (this.level > 1) console.error(this.prefix, arg, ...args);
  }

  info(arg: unknown, ...args: unknown[]): void {
    if (this.level > 0) console.error(this.prefix, arg, ...args);
  }

  warning(arg: unknown, ...args: unknown[]): void {
    console.error(this.prefix, arg, ...args);
  }

  critical(arg: unknown, ...args: unknown[]): never {
    // FIMXE this whole function
    console.error(this.prefix, arg, ...args);
    throw new Error("critical error");
  }

  panic(arg: unknown, ...args: unknown[]): never {
    console.error("internal error:", this.prefix, arg, ...args);
    throw new Error("internal error");
  }
}

export type Logger = SimpleLogger;

export default function createLogger(prefix: string, level: number): Logger {
  return new SimpleLogger(level, prefix);
}
