// Configuration des administrateurs
// En production, ces données devraient être stockées de manière sécurisée côté serveur

const ADMIN_CONFIG = {
    credentials: [
        {
            email: "admin@otakufunconcert.ml",
            password: "Admin123!", // Mot de passe par défaut
            name: "Administrateur Principal",
            role: "superadmin"
        },
        {
            email: "organisateur@otakufunconcert.ml", 
            password: "Orga2025!", // Second compte organisateur
            name: "Organisateur Événement",
            role: "admin"
        }
    ],
    security: {
        maxAttempts: 3,
        lockoutTime: 900000, // 15 minutes en millisecondes
        sessionDuration: 3600000 // 1 heure en millisecondes
    }
};

// Fonction pour vérifier les identifiants
function verifyAdminCredentials(email, password) {
    const admin = ADMIN_CONFIG.credentials.find(acc => 
        acc.email === email && acc.password === password
    );
    return admin || null;
}

// Fonction pour obtenir la configuration de sécurité
function getSecurityConfig() {
    return ADMIN_CONFIG.security;
}