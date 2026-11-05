
import React from "react";

export default function VectorFields({
  label,
  values,
  onChange,
  prefix,
}) {
  const axes = ["X", "Y", "Z"];

  const handleChange = (index, value) => {
    const next = [...values];
    next[index] = Number(value);
    onChange(next);
  };

  return (
    <div className="cube-controls__camera-group">
      <div className="cube-controls__camera-label">
        {label}
      </div>

      <div className="cube-controls__vector-fields">
        {axes.map((axis, index) => (
          <label
            className="cube-controls__number-field"
            key={`${prefix}-${axis}`}
          >
            <span>{axis}</span>

            <input
              type="number"
              step="0.1"
              value={values[index]}
              onChange={(event) =>
                handleChange(index, event.target.value)
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
