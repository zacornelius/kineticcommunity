import { AtSign, BuildingBusinessOffice, Bullhorn, Calendar, Mail, Phone, Profile, WorldNet } from '@/svg_components';
import { format } from 'date-fns';
import { GetUser } from '@/types/definitions';
import { AboutItem } from './AboutItem';

export function About({ profile }: { profile: GetUser }) {
  const { username, email, name, birthDate, phoneNumber, bio, website, address } = profile;
  return (
    <div className="flex flex-col gap-4">
      <AboutItem field="Username" value={username} Icon={AtSign} />
      <AboutItem field="Email" value={email} Icon={Mail} />
      <AboutItem field="Name" value={name} Icon={Profile} />
      <AboutItem
        field="Birth Date"
        value={birthDate !== null ? format(new Date(birthDate), 'MMMM d, yyyy') : null}
        Icon={Calendar}
      />
      <AboutItem field="Bio" value={bio} Icon={Bullhorn} />
      <AboutItem field="Phone Number" value={phoneNumber} Icon={Phone} />
      <AboutItem field="Website" value={website} Icon={WorldNet} />
      <AboutItem field="Address" value={address} Icon={BuildingBusinessOffice} />
    </div>
  );
}
