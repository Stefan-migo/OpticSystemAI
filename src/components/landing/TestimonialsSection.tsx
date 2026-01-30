"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. María González",
    role: "Directora, Óptica Visión Clara",
    image: "👩‍⚕️",
    content:
      "Opttius ha transformado completamente nuestra operación. El sistema de citas automatizado y el chatbot nos han ahorrado horas cada día.",
    rating: 5,
  },
  {
    name: "Carlos Ramírez",
    role: "Propietario, Óptica Centro",
    image: "👨‍💼",
    content:
      "La gestión multi-sucursal es increíble. Puedo ver todo desde un solo lugar y las analíticas me ayudan a tomar mejores decisiones.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Gerente, Laboratorio Óptico Premium",
    image: "👩‍🔬",
    content:
      "El sistema de presupuestos y órdenes es perfecto. Los cálculos automáticos eliminan errores y aceleran nuestro proceso.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ópticas y laboratorios que confían en Opttius
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Quote className="absolute top-6 right-6 h-12 w-12 text-blue-100" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
