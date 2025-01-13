type SNB = string | number | boolean;
export interface ISettingsStorage {
  /**
   *
   * Retrieves a setting for a certain document
   * with a default value for this type
   *
   * Example: UseDarkBackGround can be set per document
   * but there is also a default value per user
   *
   *
   * @param groupKey
   * @param documentKey
   * @param defaultValue
   */
  getValue<T extends SNB>(
    groupKey: string,
    documentKey: string,
    defaultValue: T,
  ): T;

  setValue(groupKey: string, documentKey: string, value: string);

  setGroupDefault(groupKey: string, defaultValue: string);

  overrideSettingsByGroupDefault(groupKey: string);
}

const validVariableName = /[_A-Za-z][_A-Za-z0-9]*/;
const DEFAULTSCOPE = "settings";

export class DefaultSettingsStorage implements ISettingsStorage {
  scope: string;

  constructor(scope?: string) {
    this.scope = scope || DEFAULTSCOPE;
  }

  getValue<T extends SNB>(
    groupKey: string,
    documentKey: string,
    defaultValue: T,
  ): T {
    const documentValue = localStorage.getItem(
      this.getStorageKey(groupKey, documentKey),
    );
    if (documentValue != null) return this.convert(documentValue, defaultValue);

    const groupValue = localStorage.getItem(this.getGroupKey(groupKey));
    if (groupValue != null) return this.convert(groupValue, defaultValue);

    return defaultValue;
  }

  setValue(
    groupKey: string,
    documentKey: string,
    value: string | number | boolean,
  ) {
    localStorage.setItem(
      this.getStorageKey(groupKey, documentKey),
      String(value),
    );
  }
  setGroupDefault(groupKey: string, defaultValue: string) {
    localStorage.setItem(this.getGroupKey(groupKey), defaultValue);
  }
  overrideSettingsByGroupDefault(groupKey: string) {
    throw new Error("Method not implemented.");
  }

  private convert<T extends SNB>(value: string, valueType: T): T {
    // This is safe but typescript doesn't realize
    if (typeof valueType == "boolean")
      // @ts-ignore
      return value == "true";

    if (typeof valueType == "number")
      // @ts-ignore
      return Number.parseFloat(value);

    if (typeof valueType == "string")
      // @ts-ignore
      return value;

    throw new Error("Illegal Default Value");
  }

  private getStorageKey(groupKey: string, documentKey: string): string {
    this.checkVariableName(groupKey);
    this.checkVariableName(documentKey);
    return `${this.scope}::${groupKey}::${documentKey}`;
  }

  private getGroupKey(groupKey: string): string {
    this.checkVariableName(groupKey);
    return `${this.scope}::${groupKey}`;
  }

  private checkVariableName(name: string): void {
    if (name == "" || typeof name == "undefined") return;

    const match = name.match(validVariableName);
    if (match == null || match.length == 0)
      throw new Error("Invalid Variable Name");
  }
}
