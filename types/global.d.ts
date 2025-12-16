declare const __firebase_config: string;

declare const __initial_auth_token: string;

interface CustomWindow extends Window {
    firebase: any;
}
declare var window: CustomWindow;