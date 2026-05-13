const baseUrl = 'http://localhost:3000';

async function run() {
  const demoUsers = [
    {email:'alice.demo@gmail.com', password:'Password123!'},
    {email:'bob.demo@gmail.com', password:'Password123!'},
    {email:'carol.demo@gmail.com', password:'Password123!'}
  ];

  for (const user of demoUsers) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(user)
    });
    const data = await res.json();
    console.log('LOGIN', user.email, res.status, data.message || 'OK');
  }

  const skillsRes = await fetch(`${baseUrl}/api/skills`);
  const skills = await skillsRes.json();
  console.log('SKILLS COUNT', skills.length);

  const usersRes = await fetch(`${baseUrl}/api/users`);
  const users = await usersRes.json();
  console.log('USERS COUNT', users.length);

  const alice = await fetch(`${baseUrl}/api/auth/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(demoUsers[0])
  }).then(r=>r.json());

  const bob = await fetch(`${baseUrl}/api/auth/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(demoUsers[1])
  }).then(r=>r.json());

  if (!alice.user || !bob.user) {
    console.error('Could not log in demo accounts for swap flow');
    return;
  }

  console.log('Alice ID', alice.user.id, 'Bob ID', bob.user.id);

  const bobSkillsRes = await fetch(`${baseUrl}/api/skills/user/${bob.user.id}`);
  const bobSkills = await bobSkillsRes.json();
  console.log('Bob skills', bobSkills.map(s => s.skill_name));

  if (bobSkills.length === 0) {
    console.error('Bob has no skills to swap');
    return;
  }

  // Alice requests a swap for Bob's first skill
  const requestRes = await fetch(`${baseUrl}/api/swaps/request`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({senderId: alice.user.id, receiverId: bob.user.id, skillId: bobSkills[0].id})
  });
  const requestData = await requestRes.json();
  console.log('Swap request status', requestRes.status, requestData.message);

  const bobSwapsRes = await fetch(`${baseUrl}/api/swaps/user/${bob.user.id}`);
  const bobSwaps = await bobSwapsRes.json();
  console.log('Bob swaps count', bobSwaps.length);

  if (bobSwaps.length === 0) {
    console.error('Swap request not visible to Bob');
    return;
  }

  const requestId = bobSwaps[0].id;
  const acceptRes = await fetch(`${baseUrl}/api/swaps/accept`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({requestId, meetingLink:'https://meet.google.com/abc-defg-hij'})
  });
  const acceptData = await acceptRes.json();
  console.log('Accept swap', acceptRes.status, acceptData.message);

  const completeRes = await fetch(`${baseUrl}/api/swaps/complete`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({requestId, userId: bob.user.id})
  });
  const completeData = await completeRes.json();
  console.log('Complete swap', completeRes.status, completeData.message);
}

run().catch(err => {
  console.error('ERROR', err);
  process.exit(1);
});
