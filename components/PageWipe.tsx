'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Define our color options
const colors = [
  { id: 'red', color: '#FF4B4B' },
  { id: 'blue', color: '#4B9DFF' },
  { id: 'green', color: '#37D399' },
]

export default function TestWipe() {
  const [activeColor, setActiveColor] = useState(colors[0])
  const [previousColor, setPreviousColor] = useState(colors[0])
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Set initial position for the animation
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        x: rect.width / 2,
        y: rect.height - 100,
      })
    }
  }, [])

  const handleColorChange = (
    color: (typeof colors)[0],
    e: React.MouseEvent
  ) => {
    // Store previous color before changing
    setPreviousColor(activeColor)

    // Get click position for animation origin
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    setActiveColor(color)
  }

  return (
    <div
      ref={containerRef}
      className='h-screen w-full relative overflow-hidden flex justify-center items-center'
      style={{
        backgroundColor: '#121212',
      }}
    >
      {/* Base dot pattern with previous color */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: `radial-gradient(${previousColor.color} 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Animated dot pattern that expands from the clicked position */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={activeColor.id}
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage: `radial-gradient(${activeColor.color} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
          initial={{
            clipPath: `circle(0px at ${position.x}px ${position.y}px)`,
          }}
          animate={{
            clipPath: `circle(200vh at ${position.x}px ${position.y}px)`,
          }}
          exit={{
            clipPath: `circle(0px at ${position.x}px ${position.y}px)`,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 40,
          }}
        />
      </AnimatePresence>

      {/* Circle buttons positioned at the bottom center */}
      <div className='absolute bottom-20 flex justify-center space-x-8 z-10'>
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={(e) => handleColorChange(color, e)}
            className={`w-16 h-16 rounded-full transition-all duration-200 
              ${
                activeColor.id === color.id
                  ? 'scale-110 shadow-lg'
                  : 'hover:scale-105'
              } 
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
            style={{
              backgroundColor: color.color,
              boxShadow:
                activeColor.id === color.id
                  ? `0 0 0 4px white, 0 0 0 8px ${color.color}80`
                  : 'none',
            }}
            aria-label={`Change to ${color.id} color`}
          />
        ))}
      </div>
    </div>
  )
}
