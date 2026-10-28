import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus } from 'lucide-react';

export const AddDoctorModal = () => {
  const { t, activeModal, setActiveModal, specialties, addDoctor, getLocalized } = useApp();

  const [name, setName] = useState('');
  const [specialtyId, setSpecialtyId] = useState('lor');
  const [subcategory, setSubcategory] = useState('Bolalar LOR');
  const [experienceYears, setExperienceYears] = useState(5);
  const [price, setPrice] = useState(150000);
  const [hospitalName, setHospitalName] = useState('Markaziy Shifoxona');
  const [roomNumber, setRoomNumber] = useState('201-xona');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80');
  const [bio, setBio] = useState('Malakali shifokor, ko\'p yillik tajribaga ega.');
  const [education, setEducation] = useState('Toshkent Tibbiyot Akademiyasi');

  if (activeModal !== 'add-doctor') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedSpec = specialties.find(s => s.id === specialtyId);

    addDoctor({
      name,
      specialtyId,
      specialtyName: selectedSpec ? selectedSpec.name : 'Terapevt',
      specialtyName_uz: selectedSpec ? selectedSpec.name_uz : 'Terapevt',
      specialtyName_ru: selectedSpec ? selectedSpec.name_ru : 'Терапевт',
      specialtyName_en: selectedSpec ? selectedSpec.name_en : 'Therapist',
      subcategory,
      subcategory_uz: subcategory,
      subcategory_ru: subcategory,
      subcategory_en: subcategory,
      experienceYears: Number(experienceYears),
      price: Number(price),
      hospitalName,
      hospitalName_uz: hospitalName,
      hospitalName_ru: hospitalName,
      hospitalName_en: hospitalName,
      roomNumber,
      avatar,
      bio,
      bio_uz: bio,
      bio_ru: bio,
      bio_en: bio,
      education,
      education_uz: education,
      education_ru: education,
      education_en: education
    });

    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 relative">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">{t('admin.add_doctor_btn')}</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('doctor_detail.title')}:</label>
            <input 
              type="text"
              required
              placeholder="Dr. Sherzod Rahimov"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('specialties.title')}:</label>
              <select
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{getLocalized(s, 'name')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory:</label>
              <input 
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('doctors.filter_experience')} ({t('doctors.years_suffix')}):</label>
              <input 
                type="number"
                min={1}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('doctors.consultation_fee')} (UZS):</label>
              <input 
                type="number"
                step={10000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-teal-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('booking.hospital')}:</label>
              <input 
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('booking.room')}:</label>
              <input 
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Avatar URL:</label>
            <input 
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('doctor_detail.about')}:</label>
            <textarea 
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              {t('booking.btn_back')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md"
            >
              {t('admin.add_doctor_btn')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
