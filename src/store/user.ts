import auth from '@/store/auth';

import { UserPublicData } from '@/index.d';
import eventBus from '@/eventBus';
import axios from '../axios';

export default {
    namespaced: true,

    state: {
        user: null,
        dataLoading: false,
    },

    mutations: {
        SET_USER_DATA(state: any, userData: UserPublicData) {
            state.user = userData;
        },

        SET_LOADING_STATE(state: any, payload: boolean) {
            state.dataLoading = payload;
        },
    },

    actions: {
        async loadUser(context: any, payload: string) {
            const token = payload || auth.state.tokenData?.token;
            const { user } = context.state;

            if (user) {
                return;
            }

            context.commit('SET_LOADING_STATE', true);

            try {
                const response = await axios.get(`/user/${token}`);
                const { userData } = response.data;

                context.commit('SET_USER_DATA', userData);
            } catch (error) {
                eventBus.$emit('notify-error', error.response.data.error);
            }

            context.commit('SET_LOADING_STATE', false);
        },
    },
};
