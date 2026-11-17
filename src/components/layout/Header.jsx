import React from 'react';

/**
 * DAH Dashboard Header
 * Matches WCD Header structure & styling
 */
export default function Header() {
  return (
    <header className="dah-header">
      {/* Left: Gujarat map logo + GRIT logo */}
      <div className="dah-header__left">
        <img
          src="/gujarat_map.png"
          alt="Gujarat Map"
          className="dah-header__logo"
        />
        <img
          src="/gritlogo.jpg"
          alt="GRIT Logo"
          className="dah-header__logo"
        />
      </div>

      {/* Center: 3-line title block */}
      <div className="dah-header__title-block">
        <div className="dah-header__title">
          Gujarat Rajya Institution For Transformation
        </div>
        <div className="dah-header__subtitle">
          Animal Husbandry, Fisheries &amp; Co-Operatives
        </div>
        <div className="dah-header__page-subtitle">
          Viksit Gujarat Vision @2047
        </div>
      </div>

      {/* Right: CM Photo Block */}
      <div className="dah-header__profile">
        <div className="dah-header__cm-text">
          <span className="dah-header__cm-name">Shri Bhupendra Patel</span>
          <span className="dah-header__cm-role">Hon'ble Chief Minister, Gujarat</span>
        </div>
        <img
          src="/cm_photo.png"
          alt="Hon'ble Chief Minister"
          className="dah-header__cm-photo"
        />
      </div>
    </header>
  );
}
