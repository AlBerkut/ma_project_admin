import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import store from '@/store';
import ControlPanel from '@/views/ControlPanel.vue';
import AuthPage from '../views/AuthPage.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
    {
        path: '/login',
        name: 'login',
        component: AuthPage,
    },
    {
        path: '/',
        name: 'home',
        component: ControlPanel,
        meta: {
            requiresAuth: true,
        },
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

router.beforeEach(async (to, from, next) => {
    const isAuthorized = store.getters['auth/isAuthorized'];

    if (['login'].includes(to.name || '') && isAuthorized) {
        return next({ name: 'home' });
    }

    if (to.meta.requiresAuth) {
        if (isAuthorized) {
            next();
        } else {
            next({ name: 'login' });
        }
    } else {
        next();
    }
});

export default router;
