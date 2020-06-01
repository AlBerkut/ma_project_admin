<template>
    <base-page-layout>
        <template slot="pageTitle">
            {{ translateText('controlPanel') }}
        </template>

        <div class="control-panel">
            <div class="control-panel__filters">
                <select v-model="showConfirmed" class="period-picker__start-day-picker">
                    <option :value="true">{{ translateText(`confirmed`) }}</option>
                    <option :value="false">{{ translateText(`new`) }}</option>
                </select>

                {{ translateText('placesShown', [filteredPlaces.length]) }}
            </div>

            <div class="control-panel__content">
                <table class="table table-responsive table-sm table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th class="name">{{ translateText('placeNameLabel') }}</th>
                            <th>{{ translateText('categories') }}</th>
                            <th>{{ translateText('costs') }}</th>
                            <th>{{ translateText('restDurations') }}</th>
                            <th>{{ translateText('companySizes') }}</th>
                            <th>{{ translateText('restTypes') }}</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="place in filteredPlaces" :key="place.id">
                            <td>{{ place.id }}</td>
                            <td class="name">{{ place.name }}</td>
                            <td>
                                <span
                                    class="badge badge-primary"
                                    v-for="category in place.categories"
                                    :key="category.id"
                                    >{{ category.name }}</span
                                >
                            </td>
                            <td style="white-space: nowrap;">{{ place.restCost.name }}</td>
                            <td style="white-space: nowrap;">{{ place.restDuration.name }}</td>
                            <td style="white-space: nowrap;">{{ place.companySize.name }}</td>
                            <td>
                                {{
                                    place.isActiveRest
                                        ? translateText('activeRestType')
                                        : translateText('passiveRestType')
                                }}
                            </td>
                            <td class="actions">
                                <button
                                    class="btn btn-success btn-sm"
                                    @click="confirmPlace(place)"
                                    v-if="!showConfirmed"
                                >
                                    <font-awesome-icon :icon="['fa', 'check']" />
                                </button>

                                <button class="btn btn-primary btn-sm" @click="updatePlace(place)">
                                    <font-awesome-icon :icon="['fa', 'pen']" />
                                </button>

                                <button class="btn btn-danger btn-sm" @click="removePlace(place)">
                                    <font-awesome-icon :icon="['fa', 'trash']" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <template v-if="selectedPlace">
            <v-dialog ref="editPlaceDialog" :max-width="1000" @close="selectedPlace = null">
                <template slot="header">
                    {{ translateText('updatePlaceDialogTitle') }}
                </template>

                <place-form ref="placeForm" :place="selectedPlace"></place-form>

                <template slot="footer">
                    <button class="btn btn-primary left-button" @click="updatePlaceRequest">
                        {{ translateText('updatePlace') }}
                    </button>

                    <button class="btn btn-secondary" @click="editPlaceDialog.triggerClose()">
                        {{ translateText('close') }}
                    </button>
                </template>
            </v-dialog>
        </template>
    </base-page-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import eventBus from '@/eventBus';
import store from '@/store';
import { Ref } from 'vue-property-decorator';
import PlaceForm from '@/components/PlaceForm.vue';
import VDialog from '@/components/VDialog.vue';
import BasePageLayout from './BasePageLayout.vue';

import axios from '../axios';

@Component({
    name: 'ControlPanel',
    components: {
        BasePageLayout,
        PlaceForm,
        VDialog,
    },
    async beforeRouteEnter(to: any, from: any, next: any) {
        try {
            await store.dispatch('user/loadUser');
            await store.dispatch('filters/loadFilters');
        } catch (error) {
            eventBus.$emit('notify-error', error.response.data.error);
        }

        const { user } = (store.state as any).user;

        if (user.isAdmin) {
            next();
        } else {
            next('/login');
        }
    },
})
export default class ControlPanel extends Vue {
    places = [];

    showConfirmed = true;

    selectedPlace = null;

    @Ref() editPlaceDialog!: any;

    @Ref() placeForm!: any;

    get filteredPlaces() {
        return this.places.filter((place: any) => place.isConfirmed === this.showConfirmed);
    }

    async created() {
        try {
            const response = await axios.get('/places', {
                params: { ignoreStatus: true },
            });

            this.places = response.data.places;
        } catch (error) {
            eventBus.$emit('notify-error', error.response.data.error);
        }
    }

    async removePlace(place: any) {
        // eslint-disable-next-line no-alert
        if (window.confirm(`Delete place ${place.name}?`)) {
            try {
                await axios.post('/places/delete', {
                    ids: [place.id],
                });

                this.places = this.places.filter((item) => item !== place);

                eventBus.$emit('notify-success', this.translateText('placeRemoved'));
            } catch (error) {
                eventBus.$emit('notify-error', error.response.data.error);
            }
        }
    }

    updatePlace(place: any) {
        this.selectedPlace = place;

        this.$nextTick(() => {
            this.editPlaceDialog.open();
        });
    }

    async updatePlaceRequest() {
        const placeData = this.placeForm.getPlaceData();

        try {
            await axios.post('/places/update', placeData);
            this.editPlaceDialog.triggerClose();
            this.$router.go(0);
        } catch (error) {
            eventBus.$emit('notify-error', error.response.data.error);
        }
    }

    async confirmPlace(place: any) {
        try {
            await axios.post('/places/confirm', { id: place.id });

            // eslint-disable-next-line no-param-reassign
            place.isConfirmed = true;

            eventBus.$emit('notify-success', this.translateText('placeConfirmed'));
        } catch (error) {
            eventBus.$emit('notify-error', error.response.data.error);
        }
    }
}
</script>

<style scoped lang="scss">
.control-panel {
    padding: 12px;

    &__filters {
        margin-bottom: 18px;
    }

    .table {
        th {
            white-space: nowrap;
        }

        .name {
            width: 100%;
        }

        .actions {
            white-space: nowrap;
        }

        td,
        th {
            padding: 0.3rem 1rem;
        }

        .badge,
        .btn {
            margin: 0 3px;
        }
    }
}
</style>
