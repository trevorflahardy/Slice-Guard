import { defineStore } from 'pinia';

export interface UserProfileTarget {
    labId: number;
    userId: number;
}

export const useUiStore = defineStore('ui', {
    state: () => ({
        userProfile: null as UserProfileTarget | null,
    }),
    actions: {
        openUserProfile(target: UserProfileTarget) {
            this.userProfile = target;
        },
        closeUserProfile() {
            this.userProfile = null;
        },
    },
});
