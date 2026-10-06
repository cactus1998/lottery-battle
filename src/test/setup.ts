import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom 沒有實作 canvas，回傳 null 讓 Renderer 安靜地略過繪製
HTMLCanvasElement.prototype.getContext = (() => null) as never

afterEach(() => cleanup())
