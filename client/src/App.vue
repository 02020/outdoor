<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN, type GlobalThemeOverrides } from 'naive-ui'
import { RouterView } from 'vue-router'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#10B981',
    primaryColorHover: '#059669',
    primaryColorPressed: '#047857',
    primaryColorSuppl: '#34D399',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  Button: {
    heightMedium: '44px',
    borderRadiusMedium: '12px',
    fontSizeMedium: '15px',
    fontWeightStrong: '600',
  },
  Card: {
    borderRadius: '16px',
    paddingMedium: '16px',
  },
  Input: {
    heightMedium: '44px',
    borderRadius: '10px',
    fontSizeMedium: '15px',
  },
  InputNumber: {
    heightMedium: '44px',
    borderRadius: '10px',
  },
  Select: {
    heightMedium: '44px',
  },
  Tag: {
    borderRadius: '6px',
  },
  Dialog: {
    borderRadius: '16px',
  },
  DataTable: {
    borderRadius: '12px',
    fontSizeMedium: '14px',
  },
}
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
body {
  margin: 0;
  background: #F0FDF4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
