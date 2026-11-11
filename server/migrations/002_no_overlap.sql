-- Last line of defence: the database itself refuses two live bookings that overlap in one box.
create extension if not exists btree_gist;
alter table bookings add constraint bookings_no_overlap exclude using gist (
  date with =,
  box with =,
  int4range(start_min, start_min + duration) with &&
) where (wash <> 'cancelled');
