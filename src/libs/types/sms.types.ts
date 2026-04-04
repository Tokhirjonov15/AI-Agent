export type SmsResponse = {
  ok: boolean;
  mock: boolean;
  sid?: string;
  status?: string;
  preview?: {
    to: string;
    message: string;
  };
};
