export const settingFormat = '0.2.0';

export interface ISetting {
    format: string;
    version: number;
    books: Array<string>;
};

export const defaultSetting = () => ({
    format: settingFormat,
    version: 0,
    books: []
}) as ISetting;