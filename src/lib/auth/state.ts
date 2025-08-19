import { auth } from "../auth";

async function checkAuthState(context: any) {
    const isAuthed = await auth.api
        .getSession({
            headers: context.request.headers,
        })
    return !!isAuthed
}

export { checkAuthState };