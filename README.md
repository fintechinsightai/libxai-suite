# 🚀 LibXAI Suite

### Generador de Diagramas de Gantt con Inteligencia Artificial para Gestión Inteligente de Proyectos

<p align="center">
  <img src="./src/assets/project-screenshot.jpg" alt="LibXAI Suite - Vista del Proyecto" width="90%" style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
</p>

<div align="center">

[![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)

</div>

---

## 🌟 Vista Previa de la Aplicación

> **🎯 Gestión de Proyectos Redefinida**: Experimenta cronogramas inteligentes con seguimiento automático de progreso, análisis predictivo en tiempo real y asistente IA integrado.

### 🖥️ Características Visuales Destacadas

- **📊 Cronograma Inteligente**: Visualización clara de mayo a julio 2025 con progreso en tiempo real
- **🎨 Diseño Moderno**: Interfaz oscura profesional con elementos coloridos para mejor experiencia de usuario
- **📈 Indicadores de Progreso**: Barras de progreso dinámicas (100%, 30%, 25%, 5%, 0%, 10%)
- **🤖 Asistente IA**: Panel lateral integrado para optimización automática de tareas
- **⚡ EDT Inteligente**: Estructura de Desglose del Trabajo con jerarquía visual

---

## 🎯 Descripción General

LibXAI Suite es una librería de diagramas de Gantt de vanguardia, potenciada por inteligencia artificial, que **revoluciona la gestión de proyectos** a través de automatización inteligente y análisis predictivo. Construida con tecnologías web modernas, proporciona a los desarrolladores herramientas poderosas para crear cronogramas de proyectos inteligentes y adaptativos.

## ✨ Características Principales

### 🤖 **Inteligencia Artificial Avanzada**

```
🎯 Programación Inteligente de Tareas    → Optimización automática de secuencias
📊 Análisis Predictivo                   → Predicción de fechas y cuellos de botella
🔄 Asignación Inteligente de Recursos    → Distribución IA y resolución de conflictos
⚠️ Evaluación de Riesgos                → Identificación automatizada de riesgos
```

### 📊 **Capacidades Avanzadas de Gantt**

- **🎭 Cronograma Interactivo**: Gestión con arrastrar y soltar + actualizaciones en tiempo real
- **🔗 Gestión de Dependencias**: Mapeo inteligente de relaciones entre tareas
- **🎯 Análisis de Ruta Crítica**: Identificación automatizada de tareas críticas
- **🌐 Vistas Multi-proyecto**: Gestiona múltiples proyectos con paneles unificados

### 🎨 **Experiencia de Usuario Moderna**

- ✅ **Diseño Responsivo**: Perfecto en escritorio, tablet y móvil
- 🌓 **Temas Oscuro/Claro**: Modos de apariencia personalizables
- 👥 **Colaboración en Tiempo Real**: Edición multiusuario con sincronización en vivo
- 📤 **Capacidades de Exportación**: PDF, PNG y Excel

---

## 🛠️ Pila Tecnológica

<table>
<tr>
<td width="50%">

**🎨 Frontend**

- React 19.0 + TypeScript 5.7
- Vite 6.3 para desarrollo ultrarrápido
- CSS moderno con Módulos CSS

</td>
<td width="50%">

**🤖 Backend IA**

- Algoritmos personalizados para programación
- Patrón React Context + Hooks
- Jest + React Testing Library

</td>
</tr>
</table>

---

## 📦 Instalación y Configuración

### **🚀 Clonar y ejecutar localmente:**

```bash
# 📂 Clonar el repositorio
git clone https://github.com/libxai/ganttAI.git

# 📁 Navegar al directorio
cd ganttAI

# 📦 Instalar dependencias
npm install

# 🚀 Iniciar servidor de desarrollo
npm run dev

# 🏗️ Construir para producción
npm run build
```

### **📋 Como librería (próximamente en NPM):**

```bash
# 🎯 Instalar vía npm (cuando esté publicada)
npm install libxai-suite

# 🧶 Instalar vía yarn
yarn add libxai-suite

# ⚡ Instalar vía pnpm
pnpm add libxai-suite
```

## 🚀 Ejemplo de Uso

```typescript
import { GanttChart, AIScheduler } from "libxai-suite";

const MiProyecto = () => {
  const tareas = [
    {
      id: "1",
      titulo: "Planificación Estratégica",
      inicio: "2025-06-01",
      duracion: 5,
      progreso: 100,
      dependencias: [],
    },
    {
      id: "2",
      titulo: "Desarrollo Técnico",
      inicio: "2025-06-06",
      duracion: 15,
      progreso: 30,
      dependencias: ["1"],
    },
    {
      id: "3",
      titulo: "Pruebas y Control de Calidad",
      inicio: "2025-07-01",
      duracion: 10,
      progreso: 25,
      dependencias: ["2"],
    },
  ];

  return (
    <GanttChart
      tasks={tareas}
      aiEnabled={true}
      theme="dark"
      showProgress={true}
      onTaskUpdate={(tareasOptimizadas) => {
        console.log("🤖 Tareas optimizadas por IA:", tareasOptimizadas);
      }}
      onAIAssist={(sugerencias) => {
        console.log("💡 Sugerencias IA:", sugerencias);
      }}
    />
  );
};
```

---

## 📈 **Características de IA en Detalle**

<div align="center">

### 🧠 **Motor de IA Propietario**

</div>

| Funcionalidad                      | Descripción                        | Beneficio                 |
| ---------------------------------- | ---------------------------------- | ------------------------- |
| 📊 **Análisis Histórico**          | Analiza datos de proyectos pasados | Predicciones más precisas |
| ⚡ **Optimización en Tiempo Real** | Ajustes automáticos de cronograma  | Eficiencia maximizada     |
| 🎯 **Detección de Patrones**       | Identifica tendencias y bloqueos   | Prevención proactiva      |
| 🔮 **Pronóstico Inteligente**      | Predice fechas de finalización     | Planificación confiable   |

---

## 🎯 **Casos de Uso Reales**

<table>
<tr>
<td width="33%">

### 💻 **Desarrollo de Software**

- Planificación de sprints
- Gestión de lanzamientos
- Seguimiento de errores
- Integración continua

</td>
<td width="33%">

### 🏗️ **Proyectos de Construcción**

- Optimización de cronogramas
- Programación de recursos
- Control de calidad
- Gestión de proveedores

</td>
<td width="33%">

### 📱 **Campañas de Marketing**

- Coordinación multicanal
- Lanzamientos de productos
- Eventos corporativos
- Análisis de ROI

</td>
</tr>
</table>

---

## ⚡ **Métricas de Rendimiento**

<div align="center">

| Métrica                      | Valor                 | Estado          |
| ---------------------------- | --------------------- | --------------- |
| 🚀 **Renderizado**           | >1000 tareas          | ✅ Optimizado   |
| ⚡ **Tiempo Respuesta**      | <100ms                | ✅ Ultra-rápido |
| 📱 **Puntuación Lighthouse** | 95+                   | ✅ Excelente    |
| 🌐 **Compatibilidad**        | Todos los navegadores | ✅ Universal    |

</div>

---

## 🗺️ **Hoja de Ruta**

### 🎯 **Versión 2.0** (T3 2025)

- [ ] 🧠 Integración de Aprendizaje Automático para reconocimiento de patrones
- [ ] 🔄 Optimización avanzada de recursos impulsada por IA
- [ ] 🔗 Integración con Jira, Asana, Monday.com
- [ ] 📱 Aplicación móvil complementaria iOS/Android

### 🚀 **Versión 2.1** (T4 2025)

- [ ] 🗣️ Procesamiento de Lenguaje Natural para creación de tareas
- [ ] 📊 Reportes de estado automatizados con perspectivas IA
- [ ] 📈 Panel de análisis avanzado con ML
- [ ] 🔐 Integración SSO empresarial (SAML, OAuth)

---

## 🔧 **Configuración de Desarrollo**

```bash
# 📂 Clonar el repositorio
git clone https://github.com/libxai/ganttAI.git

# 📁 Navegar al directorio
cd ganttAI

# 📦 Instalar dependencias
npm install

# 🚀 Iniciar servidor de desarrollo
npm run dev

# 🏗️ Construir para producción
npm run build

# 🧪 Ejecutar pruebas
npm run test

# 👀 Vista previa de producción
npm run preview
```

---

## 🤝 **Contribuir**

¡Damos la bienvenida a las contribuciones! Consulta nuestras [**Guías de Contribución**](CONTRIBUTING.md).

```bash
# 🍴 Hacer fork del repositorio
# 🌿 Crear rama de característica
git checkout -b feature/caracteristica-increible

# 💾 Hacer commit de cambios
git commit -m '✨ Agregar característica increíble'

# 📤 Hacer push a la rama
git push origin feature/caracteristica-increible

# 🔄 Abrir Pull Request
```

---

## 📞 **Contacto y Soporte**

<div align="center">

| Canal                     | Información                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| 👨‍💻 **Desarrollador**      | fintechinsightai                                                    |
| 📧 **Correo Electrónico** | hello@libxai.com                                                    |
| 🌐 **Sitio Web**          | [libxai.com](https://libxai.com)                                    |
| 🐛 **Problemas**          | [GitHub Issues](https://github.com/libxai/ganttAI/issues)           |
| 💬 **Discusiones**        | [GitHub Discussions](https://github.com/libxai/ganttAI/discussions) |

</div>

---

## 📊 **Estadísticas del Proyecto**

<div align="center">

![Estrellas GitHub](https://img.shields.io/github/stars/libxai/ganttAI?style=for-the-badge&logo=github&color=FFD700)
![Forks GitHub](https://img.shields.io/github/forks/libxai/ganttAI?style=for-the-badge&logo=github&color=32CD32)
![Issues GitHub](https://img.shields.io/github/issues/libxai/ganttAI?style=for-the-badge&logo=github&color=FF6B6B)
![Contribuidores GitHub](https://img.shields.io/github/contributors/libxai/ganttAI?style=for-the-badge&logo=github&color=4ECDC4)

</div>

---

<div align="center">

### 📄 **Licencia**

Este proyecto está licenciado bajo la **Licencia MIT** - consulta el archivo [LICENSE](LICENSE) para más detalles.

### 🌟 **Reconocimientos**

Construido con 🤖 **IA** y ❤️ **creatividad humana** por el equipo **LibXAI**

**¡Únete a la revolución de la gestión de proyectos inteligente!** 🚀

</div>
