import React from 'react';
import { AIPersonality } from '../../services/ai-service';
import { aiService } from '../../services/ai-service';
import './AIPersonalitySelector.css';

interface AIPersonalitySelectorProps {
  selected: AIPersonality;
  onChange: (personality: AIPersonality) => void;
}

export const AIPersonalitySelector: React.FC<AIPersonalitySelectorProps> = ({
  selected,
  onChange,
}) => {
  const personalities = aiService.getPersonalities();

  return (
    <select
      className="ai-personality-selector"
      value={selected}
      onChange={(e) => onChange(e.target.value as AIPersonality)}
    >
      {personalities.map((p) => {
        const info = aiService.getPersonalityInfo(p);
        return (
          <option key={p} value={p}>
            {info.name}
          </option>
        );
      })}
    </select>
  );
};
