<template>
    <div class="categoryBlock">
        <p class="objectCategory" v-on:click="clickedObjectCategory">
            {{ category }}
            <img v-if="!categoryCollapsiblesStatus()" class="circle-plus" src="../../../../assets/listElements/circle-plus.svg"/>
            <img v-else class="circle-minus" src="../../../../assets/listElements/circle-minus.svg"/>
            
        </p>
        <div class="objectList" v-bind:class="{ expanded: categoryCollapsiblesStatus() }">
            <object-item
                    v-for="(item, itemName) in items"
                    v-if="item.section === section && item.category === category && item.activated"
                    :item="item" :name="itemName"/>
        </div>
    </div>
</template>

<script>
    import { actionCreator, CLICKED_COLLAPSIBLE } from '../../../actions';
    import ObjectItem from './ObjectItem';
    import { $select } from '../../../sagas/vue';
    import { getCollapsibleState } from '../../../selectors';

    export default {
        name: "object-category",
        data() {
            return {
                clicked: false
            }
        },
        methods: {
            clickedObjectCategory: function () {
                this.$root.$emit('put', actionCreator(CLICKED_COLLAPSIBLE, {
                    section: this.section,
                    category: this.category
                }));
            },
            categoryCollapsiblesStatus: function () {
                return $select(getCollapsibleState, this.section, this.category);
            }
        },
        computed: {
            items: function () {
                return window.objectsAvailable;
            }
        },
        updated: function() {
            if (!this.clicked && this.categoryCollapsiblesStatus()) {
                this.clickedObjectCategory();
                this.clicked = true;
            }
        },
        props: ['section', 'category'],
        components: {
            'object-item': ObjectItem
        },
    }
</script>