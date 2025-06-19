import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sample misfortune cards data for university life
const misfortuneCards = [
  { name: "Dimenticato l'esame", image_url: "/images/cards/forgot_exam.svg", misfortune_index: 80.5 },
  { name: "PC si spegne durante l'esame online", image_url: "/images/cards/shutdown_during_exam.svg", misfortune_index: 90.0 },
  { name: "Sveglia non suona", image_url: "/images/cards/alarm.svg", misfortune_index: 75.0 },
  { name: "Caffè rovesciato sugli appunti", image_url: "/images/cards/spilled_coffie.svg", misfortune_index: 65.5 },
  { name: "Professore arrabbiato", image_url: "/images/cards/angry_teacher.svg", misfortune_index: 60.0 },
  { name: "Materia cancellata", image_url: "/images/cards/lecture_canceled.svg", misfortune_index: 35.0 },
  { name: "File con la tesi corrotto", image_url: "/images/cards/corrupted_file.svg", misfortune_index: 95.5 },
  { name: "Dormire durante la lezione", image_url: "/images/cards/sleep_during_class.svg", misfortune_index: 30.0 },
  { name: "Dimenticato il badge universitario", image_url: "/images/cards/forgot_badge.svg", misfortune_index: 20.5 },
  { name: "Cercare parcheggio per ore", image_url: "/images/cards/parking.svg", misfortune_index: 40.0 },
  { name: "Pioggia senza ombrello", image_url: "/images/cards/raining.svg", misfortune_index: 25.5 },
  { name: "Lezione cambiata all'ultimo", image_url: "/images/cards/lecture_changed_last_minute.svg", misfortune_index: 35.5 },
  { name: "Stampante non funziona", image_url: "/images/cards/printer.svg", misfortune_index: 45.0 },
  { name: "Esame rinviato", image_url: "/images/cards/postponed.svg", misfortune_index: 50.5 },
  { name: "Perdere il portafoglio", image_url: "/images/cards/lost_wallet.svg", misfortune_index: 85.0 },
  { name: "Rimanere chiusi in biblioteca", image_url: "/images/cards/trapped.svg", misfortune_index: 55.0 },
  { name: "Perdere gli appunti", image_url: "/images/cards/lost_notes.svg", misfortune_index: 70.5 },
  { name: "Autobus in ritardo", image_url: "/images/cards/lost_bus.svg", misfortune_index: 45.5 },
  { name: "Bocciato all'esame", image_url: "/images/cards/bad_grade.svg", misfortune_index: 89.0 },
  { name: "Macchiare i vestiti prima di una presentazione", image_url: "/images/cards/stained_clothes.svg", misfortune_index: 60.5 },
  { name: "Computer rubato", image_url: "/images/cards/stolen_pc.svg", misfortune_index: 92.5 },
  { name: "Telefono suona durante l'esame", image_url: "/images/cards/phone_rings_during_exam.svg", misfortune_index: 65.0 },
  { name: "Dimenticare la password dell'account universitario", image_url: "/images/cards/forgot_uni_email.svg", misfortune_index: 40.5 },
  { name: "Cadere dalle scale", image_url: "/images/cards/falling_down_stairs.svg", misfortune_index: 75.5 },
  { name: "Trovare l'aula occupata", image_url: "/images/cards/full_lecture_room.svg", misfortune_index: 30.5 },
  { name: "Inviare l'email al professore sbagliato", image_url: "/images/cards/email_wrong_email.svg", misfortune_index: 55.5 },
  { name: "Rimanere bloccati in ascensore", image_url: "/images/cards/stuck_in_elevator.svg", misfortune_index: 80.0 },
  { name: "Pagina web dell'università non funziona", image_url: "/images/cards/uni_web_page_down.svg", misfortune_index: 50.0 },
  { name: "Perdere la chiave di casa", image_url: "/images/cards/lost_keys.svg", misfortune_index: 70.0 },
  { name: "Powerbank scarica", image_url: "/images/cards/out_of_charge_powerbank.svg", misfortune_index: 35.5 },
  { name: "Compagno di studio inaffidabile", image_url: "/images/cards/bad_study_partner.svg", misfortune_index: 60.0 },
  { name: "Connessione internet instabile", image_url: "/images/cards/bad_internet.svg", misfortune_index: 55.0 },
  { name: "Perdersi nel campus", image_url: "/images/cards/lost_in_campus.svg", misfortune_index: 25.0 },
  { name: "Consegna in ritardo", image_url: "/images/cards/late_package.svg", misfortune_index: 65.0 },
  { name: "Mal di testa durante l'esame", image_url: "/images/cards/migraine_during_exam.svg", misfortune_index: 60.0 },
  { name: "Studente rumoroso in biblioteca", image_url: "/images/cards/loud_library_student.svg", misfortune_index: 40.0 },
  { name: "Gruppi di studio divisi", image_url: "/images/cards/divided_study_group.svg", misfortune_index: 45.0 },
  { name: "Presentazione cancellata", image_url: "/images/cards/presentation_canceled.svg", misfortune_index: 70.0 },
  { name: "Argomento esame mai studiato", image_url: "/images/cards/exam_theme_not_studied.svg", misfortune_index: 85.0 },
  { name: "Iscrizione all'esame non registrata", image_url: "/images/cards/forgot_register.svg", misfortune_index: 75.0 },
  { name: "Sito del libro di testo offline", image_url: "/images/cards/book_site_down.svg", misfortune_index: 50.0 },
  { name: "Penna che smette di scrivere", image_url: "/images/cards/pen_out_of_ink.svg", misfortune_index: 30.0 },
  { name: "Professore che parla troppo velocemente", image_url: "/images/cards/fast_speaking_professor.svg", misfortune_index: 45.0 },
  { name: "Consegna illeggibile", image_url: "/images/cards/unreadable_question.svg", misfortune_index: 35.0 },
  { name: "Scadenza dimenticata", image_url: "/images/cards/forgot_deadline.svg", misfortune_index: 80.0 },
  { name: "Compagno di stanza rumoroso", image_url: "/images/cards/noisy_roomates.svg", misfortune_index: 55.0 },
  { name: "Cibo della mensa terribile", image_url: "/images/cards/terrible_food.svg", misfortune_index: 15.0 },
  { name: "Microfono acceso durante una lezione online", image_url: "/images/cards/open_mic.svg", misfortune_index: 60.0 },
  { name: "Libri in prestito tutti esauriti", image_url: "/images/cards/no_books_left.svg", misfortune_index: 40.0 },
  { name: "Ritardo del professore", image_url: "/images/cards/late_teacher.svg", misfortune_index: 10.0 },
  { name: "Condividere l'appartamento con studenti caotici", image_url: "/images/cards/chaotic_students.svg", misfortune_index: 65.0 }
];

// Sample user data
const sampleUsers = [
  { username: 'user1', password: 'P@ssw0rd1', salt: '' },
  { username: 'user2', password: 'P@ssw0rd2', salt: '' }
];

// Function to create images directory if it doesn't exist
const createImagesDirectory = () => {
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'cards');
  
  // Create directories recursively
  fs.mkdirSync(imagesDir, { recursive: true });
};

// Function to create placeholder images
const createPlaceholderImages = () => {
  const cardsDir = path.join(__dirname, '..', 'public', 'images', 'cards');
  
  // Create a basic SVG for each card
  misfortuneCards.forEach((card, index) => {
    const imageName = card.image_url.split('/').pop();
    const imagePath = path.join(cardsDir, imageName);
    
    // Skip if file already exists
    if (fs.existsSync(imagePath)) return;
    
    // Create a simple colored SVG based on the misfortune index
    const intensity = Math.min(Math.floor(card.misfortune_index / 10) * 25, 255);
    const color = `rgb(${intensity}, ${Math.max(0, 255 - intensity)}, 0)`;
    
    const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
        ${card.name}
      </text>
      <text x="50%" y="70%" font-family="Arial" font-size="16" fill="white" text-anchor="middle">
        Sfortuna: ${card.misfortune_index}
      </text>
    </svg>`;
    
    fs.writeFileSync(imagePath, svg);
  });
};

export { misfortuneCards, sampleUsers, createImagesDirectory, createPlaceholderImages };
