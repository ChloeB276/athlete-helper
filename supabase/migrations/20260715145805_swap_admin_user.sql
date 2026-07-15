-- Swaps which account has admin access: revoke chloeboulliung@gmail.com,
-- grant shuyi.boulliung@gmail.com.

update profiles set is_admin = false where email = 'chloeboulliung@gmail.com';
update profiles set is_admin = true where email = 'shuyi.boulliung@gmail.com';
