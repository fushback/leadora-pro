import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Coffee,
  Building2,
  Factory,
  Boxes,
  Sparkles,
  Store,
  Cake,
  Briefcase,
  Landmark,
  Home
} from 'lucide-react';

export const getCategoryIconComponent = (iconName?: string, size = 15) => {
  switch (iconName) {
    case 'ShoppingBag':
      return <ShoppingBag size={size} />;
    case 'Utensils':
      return <Utensils size={size} />;
    case 'Coffee':
      return <Coffee size={size} />;
    case 'Building2':
      return <Building2 size={size} />;
    case 'Factory':
      return <Factory size={size} />;
    case 'Boxes':
      return <Boxes size={size} />;
    case 'Sparkles':
      return <Sparkles size={size} />;
    case 'Store':
      return <Store size={size} />;
    case 'Cake':
      return <Cake size={size} />;
    case 'Briefcase':
      return <Briefcase size={size} />;
    case 'Landmark':
      return <Landmark size={size} />;
    case 'Home':
      return <Home size={size} />;
    default:
      return <Store size={size} />;
  }
};
