<template>
    <div class="not-found-page">
        <div class="not-found-card">
            <h1>404</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <router-link to="/" class="btn-home">Go to Homepage</router-link>
        </div>
    </div>
</template>

<style scoped>
.not-found-page {
    min-height: calc(100vh - 60px);
    background-color: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
}

.not-found-card {
    background: #fff;
    text-align: center;
    padding: 2rem 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
}

h1 {
    font-size: 4.5rem;
    font-weight: 800;
    color: #1f2937;
    margin: 0;
}

p {
    font-size: 1.1rem;
    color: #6b7280;
    margin: 0.75rem 0 1.5rem;
}

.btn-home {
    background-color: #0d6efd;
    color: white;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    text-decoration: none;
    display: inline-block;
    transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.btn-home:hover {
    background-color: #0b5ed7;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(13, 110, 253, 0.25);
}

@media (max-width: 480px) {
    h1 {
        font-size: 3.5rem;
    }
}
</style>
