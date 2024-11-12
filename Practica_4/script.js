document.addEventListener('DOMContentLoaded', () => {
  // Función para obtener y mostrar las habitaciones
  function fetchHabitaciones() {
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(data => mostrarHabitaciones(data))
      .catch(error => console.error('Error:', error));
  }

  // Función para mostrar las habitaciones en la tabla
  function mostrarHabitaciones(habitaciones) {
    const tabla = document.getElementById('room-table').querySelector('tbody');
    tabla.innerHTML = ''; // Vaciar la tabla antes de llenarla nuevamente

    habitaciones.forEach(habitacion => {
      const fila = document.createElement('tr');
      fila.id = `fila-${habitacion.id}`;

      fila.innerHTML = `
        <td>${habitacion.numero}</td>
        <td>${habitacion.nombre}</td>
        <td>${habitacion.tipo}</td>
        <td>${habitacion.precio}</td>
        <td>${habitacion.fechaDisponibilidad}</td>
        <td>${habitacion.reservada ? 'Reservada' : 'Disponible'}</td>
        <td>
          <button onclick="reservarLiberar(${habitacion.id})">${habitacion.reservada ? 'Liberar' : 'Reservar'}</button>
          <button onclick="eliminarHabitacion(${habitacion.id})">Eliminar</button>
        </td>
      `;

      tabla.appendChild(fila);
    });
  }

  // Función para gestionar la reserva o liberación de una habitación
  function reservarLiberar(id) {
    // Obtener los datos de la habitación actual
    fetch(`http://localhost:3000/habitaciones/${id}`)
      .then(response => response.json())
      .then(habitacion => {
        // Cambiar el estado de reservada a lo contrario
        const nuevaEstado = !habitacion.reservada;
        // Realizar la solicitud PUT para actualizar el estado en la base de datos
        return fetch(`http://localhost:3000/habitaciones/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...habitacion, reservada: nuevaEstado }) // Actualizar datos de la habitación
        });
      })
      .then(response => response.json())
      .then(() => {
        // Actualizar la lista de habitaciones para reflejar el nuevo estado
        fetchHabitaciones();
      })
      .catch(error => console.error('Error:', error));
  }
  // Función para eliminar una habitación
  function eliminarHabitacion(id) {
    // Realizar la solicitud DELETE para eliminar la habitación
    fetch(`http://localhost:3000/habitaciones/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        // Actualizar la lista de habitaciones después de eliminar
        fetchHabitaciones();
      })
      .catch(error => console.error('Error:', error));
  }

  // Evento para añadir una nueva habitación
  document.getElementById('add-room-form').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener valores del formulario
    const numero = document.getElementById('room-number').value;
    const nombre = document.getElementById('room-name').value;
    const tipo = document.getElementById('room-type').value;
    const precio = document.getElementById('room-price').value;
    const fechaDisponibilidad = document.getElementById('room-availability').value;

    // Validaciones
    if (!/^\d{3}$/.test(numero)) {
      alert('El número de habitación debe tener exactamente 3 dígitos.');
      return;
    }

    if (!/\b\w+\b \b\w+\b/.test(nombre)) {
      alert('El nombre de la habitación debe contener al menos dos palabras.');
      return;
    }

    if (!['Individual', 'Doble', 'Suite'].includes(tipo)) {
      alert('Tipo de habitación no válido.');
      return;
    }

    if (precio <= 0 || !/^\d+(\.\d{1,2})?$/.test(precio)) {
      alert('El precio debe ser un número positivo y puede tener hasta dos decimales.');
      return;
    }

    const fechaActual = new Date().toISOString().split('T')[0];
    if (fechaDisponibilidad <= fechaActual) {
      alert('La fecha de disponibilidad debe ser futura.');
      return;
    }

    // Comprobar si el número de habitación ya existe
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const numeroExistente = habitaciones.find(h => h.numero === parseInt(numero, 10));
        if (numeroExistente) {
          alert('El número de habitación ya existe.');
          return;
        }

        // Enviar datos si todas las validaciones pasan
        const nuevaHabitacion = {
          numero: parseInt(numero, 10),
          nombre: nombre.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' '),
          tipo,
          precio: parseFloat(precio),
          fechaDisponibilidad,
          reservada: false
        };

        // Realizar la solicitud POST para añadir la nueva habitación
        fetch('http://localhost:3000/habitaciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nuevaHabitacion)
        })
          .then(response => response.json())
          .then(data => {
            document.getElementById('add-room-form').reset();
            fetchHabitaciones(); // Actualizar la lista de habitaciones
          })
          .catch(error => console.error('Error:', error));
      });
  });


  // Función para contar las habitaciones reservadas y disponibles
  function contadorHabitaciones() {
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const reservadas = habitaciones.filter(h => h.reservada).length;
        const disponibles = habitaciones.length - reservadas;
        // Mostrar el resultado en el contenedor de informes
        document.getElementById('report-result').innerText = `Reservadas: ${reservadas}, Disponibles: ${disponibles}`;
      })
      .catch(error => console.error('Error:', error));
  }

  // Función para calcular el precio promedio de las habitaciones
  function precioPromedio() {
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const total = habitaciones.reduce((sum, h) => sum + h.precio, 0);
        const promedio = (total / habitaciones.length).toFixed(2);
        // Mostrar el precio promedio en el contenedor de informes
        document.getElementById('report-result').innerText = `Precio Promedio: ${promedio}`;
      })
      .catch(error => console.error('Error:', error));
  }

  // Función para saber la habitación más cara y la más barata
  function masCaraYMasBarata() {
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const masCara = habitaciones.reduce((prev, curr) => (curr.precio > prev.precio ? curr : prev));
        const masBarata = habitaciones.reduce((prev, curr) => (curr.precio < prev.precio ? curr : prev));
        document.getElementById('report-result').innerText = `Más Cara: ${masCara.nombre} - ${masCara.precio}, Más Barata: ${masBarata.nombre} - ${masBarata.precio}`;
      });
  }

  // Función para distinguir las habitaciones por tipo
  function disponiblesPorTipo() {
    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const disponibles = habitaciones.filter(h => !h.reservada);
        const tipos = disponibles.reduce((acc, curr) => {
          acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
          return acc;
        }, {});
        document.getElementById('report-result').innerText = `Individual: ${tipos.Individual || 0}, Doble: ${tipos.Doble || 0}, Suite: ${tipos.Suite || 0}`;
      });
  }

  // Función para listar las habitaciones disponibles en los próximos 7 días
  function disponiblesProximos7Dias() {
    const hoy = new Date();
    const proximos7Dias = new Date(hoy);
    proximos7Dias.setDate(hoy.getDate() + 7);

    fetch('http://localhost:3000/habitaciones')
      .then(response => response.json())
      .then(habitaciones => {
        const disponibles = habitaciones.filter(h => {
          const fecha = new Date(h.fechaDisponibilidad);
          return fecha >= hoy && fecha <= proximos7Dias;
        });

        const listaHabitaciones = disponibles.map(h => `${h.nombre} - ${h.fechaDisponibilidad}`).join(', ');
        // Mostrar la lista de habitaciones disponibles en el contenedor de informes
        document.getElementById('report-result').innerText = `Disponibles en los próximos 7 días: ${listaHabitaciones}`;
      })
      .catch(error => console.error('Error:', error));
  }

  // Asignar eventos a los botones de informes
  document.getElementById('most-expensive').addEventListener('click', masCaraYMasBarata);
  document.getElementById('available-by-type').addEventListener('click', disponiblesPorTipo);
  document.getElementById('count-rooms').addEventListener('click', contadorHabitaciones);
  document.getElementById('average-price').addEventListener('click', precioPromedio);
  document.getElementById('available-next-7-days').addEventListener('click', disponiblesProximos7Dias);

  // Llamar a la función para cargar las habitaciones inicialmente
  fetchHabitaciones();
});