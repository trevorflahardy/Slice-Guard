<script setup lang="ts">
import Button from '../../components/Button.vue';
</script>

<template>
    <div class="w-full bg-foreground drop-shadow-sm py-3 px-5">
        <p class="text-lg font-semibold text-start">
            Slice Guard
        </p>
    </div>

    <div class="flex flex-col items-center min-h-screen bg-background gap-5">
        <div>
            <h1 class="text-4xl font-semibold text-center mt-20">
                Hello Again
            </h1>
            <p class="text-sm text-gray-500 text-center mt-2">
                It's nice to see you :)
            </p>
        </div>

        <div
            class="flex flex-col items-center justify-center w-full max-w-sm md:max-w-md gap-3 mt-10 text-sm text-gray-400">
            <!--User email, placeholder for now -->
            <div class="col-span-2 text-start bg-foreground shadow-md py-3 px-5 rounded-xl w-full">
                <p class="">Please log in to continue</p>
            </div>

            <!-- User password, placeholder for now -->
            <div class="col-span-2 text-start bg-foreground shadow-md py-3 px-5 rounded-xl w-full">
                <p class="">Enter your password</p>
            </div>

            <!-- Labels for forgot password and "Show password" characters, placeholder for now -->
            <div>
            </div>

            <!-- Login button, main button -->
            <div class="w-full">
                <Button variant="primary" class="col-span-2 mt-4 w-full py-2">
                    Log In
                </Button>
                <Button variant="secondary" class="col-span-2 mt-2 w-full py-2">
                    Sign Up
                </Button>
            </div>
        </div>
    </div>
</template>