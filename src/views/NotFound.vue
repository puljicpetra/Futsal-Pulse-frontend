<template>
    <div class="not-found-container">
        <h1>404</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <router-link to="/" class="btn-home">Go to Homepage</router-link>
    </div>
</template>

<style scoped>
.not-found-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 200px);
    text-align: center;
}

h1 {
    font-size: 6rem;
    font-weight: bold;
    color: #333;
    margin: 0;
}

p {
    font-size: 1.25rem;
    color: #666;
    margin: 1rem 0 2rem;
}

.btn-home {
    background-color: #0d6efd;
    color: white;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    text-decoration: none;
    border: none;
    cursor: pointer;
}
</style>
