# 横向滚动渐变模糊效果实现文档

## 📋 概述

本文档详细说明了如何为横向滚动的角色卡片列表实现边缘渐变模糊效果，包括滚动状态检测、渐变遮罩创建和动态显示控制。

## 🎯 功能需求

- 当左侧还有内容可滚动时，在左侧显示从内到外的渐变模糊
- 当右侧还有内容可滚动时，在右侧显示从内到外的渐变模糊
- 渐变遮罩固定在容器边缘，不跟随内容滚动
- 隐藏横向滚动条，提供更简洁的界面

## 🏗️ 实现架构

### 1. 组件结构
```jsx
<div className="my-roles-scroll-container">
  {/* 左侧渐变遮罩 */}
  {scrollState.canScrollLeft && (
    <div className="scroll-gradient-left" />
  )}
  
  {/* 右侧渐变遮罩 */}
  {scrollState.canScrollRight && (
    <div className="scroll-gradient-right" />
  )}
  
  <div ref={myRolesScrollRef} className="my-roles-scroll">
    {/* 滚动内容 */}
  </div>
</div>
```

### 2. 状态管理
```typescript
const [scrollState, setScrollState] = useState({
  canScrollLeft: false,
  canScrollRight: false,
});
```

## 🔧 核心实现

### 1. 滚动状态检测

#### 检测函数
```typescript
const checkScrollState = useCallback(() => {
  const container = myRolesScrollRef.current;
  if (!container) return;

  const { scrollLeft, scrollWidth, clientWidth } = container;
  
  setScrollState({
    canScrollLeft: scrollLeft > 0,
    canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
  });
}, []);
```

#### 事件监听
```typescript
useEffect(() => {
  const container = myRolesScrollRef.current;
  if (!container) return;

  // 初始检测
  checkScrollState();

  // 滚动事件监听
  container.addEventListener('scroll', checkScrollState);
  
  // 内容变化监听
  const resizeObserver = new ResizeObserver(() => {
    setTimeout(checkScrollState, 100);
  });
  resizeObserver.observe(container);

  return () => {
    container.removeEventListener('scroll', checkScrollState);
    resizeObserver.disconnect();
  };
}, [checkScrollState, myRoles]);
```

### 2. CSS 样式实现

#### 容器样式
```less
.my-roles-scroll-container {
  position: relative;
  
  .my-roles-scroll {
    position: relative;
    
    // 隐藏滚动条
    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
}
```

#### 渐变遮罩样式
```less
// 左侧渐变遮罩
.scroll-gradient-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 100%;
  background: linear-gradient(to right, 
    #f5f5f5 0%, 
    #f5f5f5fa 15%, 
    #f5f5f5e6 40%, 
    #f5f5f599 70%, 
    #f5f5f500 100%
  );
  pointer-events: none;
  z-index: 20;
  transition: opacity 0.3s ease;
  
  // 模糊效果层
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(2px);
    mask: linear-gradient(to right, 
      rgba(0, 0, 0, 1) 0%, 
      rgba(0, 0, 0, 0.8) 40%, 
      rgba(0, 0, 0, 0) 100%
    );
    -webkit-mask: linear-gradient(to right, 
      rgba(0, 0, 0, 1) 0%, 
      rgba(0, 0, 0, 0.8) 40%, 
      rgba(0, 0, 0, 0) 100%
    );
  }
}

// 右侧渐变遮罩（类似结构，方向相反）
.scroll-gradient-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 100%;
  background: linear-gradient(to left, 
    #f5f5f5 0%, 
    #f5f5f5fa 15%, 
    #f5f5f5e6 40%, 
    #f5f5f599 70%, 
    #f5f5f500 100%
  );
  pointer-events: none;
  z-index: 20;
  transition: opacity 0.3s ease;
  
  // 模糊效果层
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(2px);
    mask: linear-gradient(to left, 
      rgba(0, 0, 0, 1) 0%, 
      rgba(0, 0, 0, 0.8) 40%, 
      rgba(0, 0, 0, 0) 100%
    );
    -webkit-mask: linear-gradient(to left, 
      rgba(0, 0, 0, 1) 0%, 
      rgba(0, 0, 0, 0.8) 40%, 
      rgba(0, 0, 0, 0) 100%
    );
  }
}
```

## 🎨 视觉效果原理

### 1. 分层渲染
```
主元素层：
├── background: 颜色渐变（底层）
└── ::before 伪元素：
    ├── backdrop-filter: 模糊效果（上层）
    └── mask: 控制模糊区域透明度
```

### 2. 渐变效果
- **颜色渐变**：从 `#f5f5f5` 到透明，提供基础颜色覆盖
- **模糊渐变**：通过 `mask` 属性控制模糊效果的透明度分布
- **组合效果**：颜色渐变 + 内容模糊 = 真实的边缘淡出

### 3. 动态显示
- **条件渲染**：基于 `scrollState` 动态显示/隐藏遮罩
- **平滑过渡**：`transition: opacity 0.3s ease` 提供淡入淡出效果

## 🔄 工作流程

1. **初始化**：组件加载时检测滚动状态
2. **滚动监听**：用户滚动时实时更新状态
3. **内容变化**：角色数据更新时重新检测
4. **遮罩显示**：根据状态动态显示相应遮罩
5. **视觉反馈**：用户看到边缘渐变提示可滚动方向

## 📱 兼容性

- **滚动条隐藏**：支持 WebKit、Firefox、IE
- **模糊效果**：`backdrop-filter` 现代浏览器支持
- **遮罩效果**：`mask` 和 `-webkit-mask` 双重支持

## 🎯 关键特性

- ✅ **固定位置**：遮罩不跟随内容滚动
- ✅ **动态显示**：根据滚动状态智能显示
- ✅ **平滑过渡**：优雅的淡入淡出动画
- ✅ **真实模糊**：使用 `backdrop-filter` 而非简单颜色覆盖
- ✅ **无滚动条**：隐藏滚动条提供简洁界面
- ✅ **响应式**：自动适应容器尺寸变化

## 🚀 扩展可能

- 支持垂直滚动渐变
- 自定义渐变颜色和模糊强度
- 添加滚动指示器
- 支持触摸设备的滚动优化

## 📝 使用说明

### 1. 引入组件
```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
```

### 2. 添加状态和引用
```typescript
const myRolesScrollRef = useRef<HTMLDivElement>(null);
const [scrollState, setScrollState] = useState({
  canScrollLeft: false,
  canScrollRight: false,
});
```

### 3. 实现检测函数
```typescript
const checkScrollState = useCallback(() => {
  const container = myRolesScrollRef.current;
  if (!container) return;

  const { scrollLeft, scrollWidth, clientWidth } = container;
  
  setScrollState({
    canScrollLeft: scrollLeft > 0,
    canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
  });
}, []);
```

### 4. 添加事件监听
```typescript
useEffect(() => {
  const container = myRolesScrollRef.current;
  if (!container) return;

  checkScrollState();
  container.addEventListener('scroll', checkScrollState);
  
  const resizeObserver = new ResizeObserver(() => {
    setTimeout(checkScrollState, 100);
  });
  resizeObserver.observe(container);

  return () => {
    container.removeEventListener('scroll', checkScrollState);
    resizeObserver.disconnect();
  };
}, [checkScrollState, myRoles]);
```

### 5. 渲染组件
```jsx
<div className="my-roles-scroll-container">
  {scrollState.canScrollLeft && (
    <div className="scroll-gradient-left" />
  )}
  {scrollState.canScrollRight && (
    <div className="scroll-gradient-right" />
  )}
  <div ref={myRolesScrollRef} className="my-roles-scroll">
    {/* 您的滚动内容 */}
  </div>
</div>
```

---

这个实现提供了完整的横向滚动渐变模糊解决方案，具有良好的用户体验和视觉效果。
