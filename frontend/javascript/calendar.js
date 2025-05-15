const apiBaseUrl = 'http://localhost:3000/api';

function showMessage(message, type = 'danger', messageElementId = 'message') {
    const messageDiv = document.getElementById(messageElementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type} mt-4 mb-3`;
    } else {
        console.warn(`Element za poruke sa ID-jem '${messageElementId}' nije pronađen.`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        console.error("KRITIČNA GREŠKA: HTML element #calendar nije pronađen!");
        if (typeof showMessage === 'function') showMessage("Greška: Kontejner za kalendar nije pronađen.", "danger");
        return;
    }

    if (typeof FullCalendar === 'undefined' || !FullCalendar.Calendar) {
        console.error("KRITIČNA GREŠKA: FullCalendar biblioteka (FullCalendar.Calendar) NIJE UČITANA ili nije dostupna! Proveri da li je main.min.js od FullCalendar-a uključen PRE ove skripte.");
        if (typeof showMessage === 'function') showMessage("Greška: Biblioteka za kalendar nije dostupna.", "danger");
        return;
    }

    try {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // Ovaj prikaz automatski koristi dayGridPlugin
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            height: 'auto',
            events: async function(fetchInfo, successCallback, failureCallback) {
                try {
                    const response = await fetch(`${apiBaseUrl}/vehicles`);
                    if (!response.ok) {
                        let errorMsg = `HTTP greška! Status: ${response.status}`;
                        try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) {}
                        throw new Error(errorMsg);
                    }
                    const vehicles = await response.json();
                    if (!Array.isArray(vehicles)) {
                        throw new Error("Neočekivani format podataka sa servera.");
                    }

                    const events = vehicles.map(vehicle => {
                        if (!vehicle.expiration_date || typeof vehicle.expiration_date !== 'string') {
                            return null;
                        }
                        let eventClassName = 'event-success';
                        try {
                            const expDateObj = new Date(vehicle.expiration_date); // Očekuje YYYY-MM-DD
                            if (!isNaN(expDateObj.getTime())) {
                                const today = new Date();
                                const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                                const expDateUTC = new Date(Date.UTC(expDateObj.getUTCFullYear(), expDateObj.getUTCMonth(), expDateObj.getUTCDate()));
                                const diffTime = expDateUTC.getTime() - todayUTC.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays < 0) { eventClassName = 'event-danger'; }
                                else if (diffDays < 7) { eventClassName = 'event-danger'; }
                                else if (diffDays < 30) { eventClassName = 'event-warning';}
                            }
                        } catch (e) {}
                        return {
                            title: `${vehicle.mark || ''} ${vehicle.model || ''} (${vehicle.registration_number || 'N/A'})`,
                            start: vehicle.expiration_date, // Mora biti YYYY-MM-DD
                            allDay: true,
                            classNames: [eventClassName],
                        };
                    }).filter(event => event !== null);
                    successCallback(events);
                } catch (error) {
                    console.error('Greška pri dohvatanju vozila za kalendar:', error);
                    if (typeof showMessage === 'function') showMessage(`Greška pri učitavanju događaja: ${error.message}`, 'danger');
                    if (typeof failureCallback === 'function') failureCallback(error);
                }
            }
        });

        calendar.render();
        console.log("FullCalendar.render() pozvan.");

    } catch (initError) {
        console.error("Greška pri inicijalizaciji FullCalendar-a:", initError);
        if (typeof showMessage === 'function') showMessage("Greška pri inicijalizaciji kalendara.", "danger");
    }
});