export interface ISettingsStorage {

    /**
     * 
     * Retrieves a setting for a certain document
     * with a default value for this type
     * 
     * Example: UseDarkBackGround can be set per doucent
     * but there is also a default value per user
     * 
     * 
     * @param groupKey 
     * @param documentKey 
     * @param defaultValue
     */
    getValue( groupKey: string, documentKey: string, defaultValue: string )

    setValue( groupKey: string, documentKey: string, value: string )

    setGroupDefault( groupKey: string, defaultValue: string )

    overrideSettingsByGroupDefault( groupKey: string ) 
}

const validVariableName = /[_A-Za-z][_A-Za-z0-9]*/
const DEFAULTSCOPE = "settings"

export class DefaultSettingsStorage implements ISettingsStorage {
    scope: string

    constructor( scope?: string )
    {
        this.scope = scope || DEFAULTSCOPE;
        
    }

    getValue(groupKey: any, documentKey: any, defaultValue: any) {
        this.isString(defaultValue)

        const documentValue = localStorage.getItem( this.getStorageKey( groupKey, documentKey ) )
        if( documentValue != null )
            return documentValue
        
        const groupValue = localStorage.getItem( this.getGroupKey( groupKey ) )
        if( groupValue != null )
            return groupValue

        return defaultValue; 
    } 

    setValue(groupKey: string, documentKey: string, value: string) {
        localStorage.setItem( this.getStorageKey( groupKey, documentKey ), value )
    }
    setGroupDefault(groupKey: string, defaultValue: string) {
        localStorage.setItem( this.getGroupKey( groupKey ), defaultValue )
    }
    overrideSettingsByGroupDefault(groupKey: string) {
        throw new Error("Method not implemented.");
    }
    

    private getStorageKey( groupKey: string, documentKey: string ): string
    {
        this.checkVariableName(groupKey)
        this.checkVariableName(documentKey)
        return `${this.scope}::${groupKey}::${documentKey}`;
    }
    
    private getGroupKey( groupKey: string ): string
    {
        this.checkVariableName(groupKey)
        return `${this.scope}::${groupKey}`
    }

    private isString( value: String ) : void {
        if( typeof name != 'string' )
            throw new Error("Name must be a string");
    }
    private checkVariableName( name: String ) : void {
        if (name == '')
            return;
        const match = name.match(validVariableName)
        if( match == null || match.length == 0 )
            throw new Error("Invalid Variable Name");
    }

}