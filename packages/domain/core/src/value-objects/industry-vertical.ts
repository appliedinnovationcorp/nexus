export type IndustryVerticalType = 
  | 'technology' 
  | 'healthcare' 
  | 'finance' 
  | 'retail' 
  | 'manufacturing' 
  | 'education' 
  | 'government' 
  | 'energy' 
  | 'transportation' 
  | 'media' 
  | 'real-estate' 
  | 'agriculture' 
  | 'consulting' 
  | 'other';

export class IndustryVertical {
  private constructor(private readonly value: IndustryVerticalType) {}

  static technology(): IndustryVertical {
    return new IndustryVertical('technology');
  }

  static healthcare(): IndustryVertical {
    return new IndustryVertical('healthcare');
  }

  static finance(): IndustryVertical {
    return new IndustryVertical('finance');
  }

  static retail(): IndustryVertical {
    return new IndustryVertical('retail');
  }

  static manufacturing(): IndustryVertical {
    return new IndustryVertical('manufacturing');
  }

  static education(): IndustryVertical {
    return new IndustryVertical('education');
  }

  static government(): IndustryVertical {
    return new IndustryVertical('government');
  }

  static energy(): IndustryVertical {
    return new IndustryVertical('energy');
  }

  static transportation(): IndustryVertical {
    return new IndustryVertical('transportation');
  }

  static media(): IndustryVertical {
    return new IndustryVertical('media');
  }

  static realEstate(): IndustryVertical {
    return new IndustryVertical('real-estate');
  }

  static agriculture(): IndustryVertical {
    return new IndustryVertical('agriculture');
  }

  static consulting(): IndustryVertical {
    return new IndustryVertical('consulting');
  }

  static other(): IndustryVertical {
    return new IndustryVertical('other');
  }

  static fromString(value: string): IndustryVertical {
    const validVerticals: IndustryVerticalType[] = [
      'technology', 'healthcare', 'finance', 'retail', 'manufacturing', 
      'education', 'government', 'energy', 'transportation', 'media', 
      'real-estate', 'agriculture', 'consulting', 'other'
    ];
    if (!validVerticals.includes(value as IndustryVerticalType)) {
      throw new Error(`Invalid industry vertical: ${value}`);
    }
    return new IndustryVertical(value as IndustryVerticalType);
  }

  getValue(): IndustryVerticalType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: IndustryVertical): boolean {
    return this.value === other.value;
  }

  getDisplayName(): string {
    const displayNames = {
      'technology': 'Technology',
      'healthcare': 'Healthcare',
      'finance': 'Finance',
      'retail': 'Retail',
      'manufacturing': 'Manufacturing',
      'education': 'Education',
      'government': 'Government',
      'energy': 'Energy',
      'transportation': 'Transportation',
      'media': 'Media',
      'real-estate': 'Real Estate',
      'agriculture': 'Agriculture',
      'consulting': 'Consulting',
      'other': 'Other'
    };
    return displayNames[this.value];
  }
}
