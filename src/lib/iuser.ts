import { defaultSetting, type ISetting } from "./isetting.ts";

export interface IUser {
   name: string;
   phone: string;
   confirmed: boolean;
   lastOtp: number;
   setting: ISetting;
}

export const newUser = (name: string, phone: string): IUser => ({
   name,
   phone,
   confirmed: false,
   lastOtp: 0,
   setting: defaultSetting(),
});
