<template>
    <div class="helperItem">
        <img class="helperIcon" :src="icon"/><p>{{description}}</p>
    </div>
</template>

<script>
    export default {
        name: "helper-item",
        props: ['icon', 'description']
    }
</script>